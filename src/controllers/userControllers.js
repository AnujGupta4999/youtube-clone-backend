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
    await user.save({validateBeforeSave:false})

return {accessToken, refreshToken}



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


export { loginUser, registerUser };
