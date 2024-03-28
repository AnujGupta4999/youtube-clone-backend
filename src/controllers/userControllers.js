import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHandler.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (e) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and acces token"
    );
  }
};
const registerUser = asynchandler(async (req, res) => {
  // Get user details from the request body
  const { fullName, email, username, password } = req.body;

  //   if (
  //     [fullName, email, username, password].some(
  //       (field) => field?.trim() === ""
  //     ))
  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }
  console.log(req.files);

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar2 = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   console.log(avatar2);
  //   console.log(avatar2.secure_url);
  if (!avatar2) {
    throw new ApiError(400, "Avatar file is required");
  }
  //   if (!avatar) {
  //     throw new ApiError(400, "Avatar file is required");
  //   }

  const user = await User.create({
    fullName,
    avtaarImage: avatar2.secure_url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
    isPublished: false,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -email"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asynchandler(async (req, res) => {
  const { username, email, password } = req.body;
  //   console.log("in")
  if (!username || !email) {
    throw new ApiError(400, "Username or email is required");
  }
  // console.log("out")

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "User not found");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //it make user disable to edit the cooies and it only modify by server side
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out suuceesfully"));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErroor(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfully"));
});

const getCurrentUser = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "currennt user fetched successfully"));
});

const updateAccountDetails = asynchandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password ");

  return res
    .status(200)
    .josn(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asynchandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatar.url,
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar upadted successfully"));
});

// const updateUserCoverImage = asynchandler(async(req, res)=>{
//     const coverImageLocalPath = req.files?.path
//     if(!coverImageLocalPath){
//         throw new ApiError(400, "coverImage file is required")
//     }

//     const  coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if(!coverImage.url){
//         throw new ApiError(400, "Error while uploading on coverImage")
//     }
//     const user = User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             coverImage:coverImage.url,
//         },
//         {new:true}
//     ).select("-password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200,user,"coverImage upadted successfully")
//     )
// })
const updateUserCoverImage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.files?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is required");
  }

  // Upload new cover image to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  // Fetch current user
  const user = await User.findById(req.user?._id).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete previous cover image from Cloudinary
  if (user.coverImage) {
    const publicId = extractPublicIdFromUrl(user.coverImage);
    await deleteFromCloudinary(publicId);
  }

  // Update user's cover image URL
  user.coverImage = coverImage.url;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// Function to extract public ID from Cloudinary image URL
function extractPublicIdFromUrl(url) {
  const parts = url.split("/");
  const publicIdWithExtension = parts[parts.length - 1];
  return publicIdWithExtension.split(".")[0];
}

// Function to delete image from Cloudinary using public ID
async function deleteFromCloudinary(publicId) {
  // Code to delete image from Cloudinary using public ID
  // Example: cloudinary.v2.uploader.destroy(publicId, (error, result) => { });
}

// Assume the functions uploadOnCloudinary, ApiResponse, and asyncHandler are defined elsewhere in your code.

const getUserChannelProfile = asynchandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "siubscribedTo",
        },
        isSubscribedTo: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribedTo: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetceh successfully"));
});

const getWatchHistory = asynchandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.objectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watchHistory fetched successfully"
      )
    );
});

export {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
