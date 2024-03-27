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
  
      const {accessToken, refreshToken}  = await generateAccessAndRefereshTokens(user._id)
      const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
      )
  //it make user disable to edit the cooies and it only modify by server side
      const options = {
          httpOnly:true,
          secure:true
      }
  
  return res
          .status(200)
          .cookie("accessToken",accessToken,options)
          .cookie("refreshToken",refreshToken,options)
          .json(
              new ApiResponse(
                  200,
                  {
                      user:loggedInUser,accessToken,refreshToken
                  },
                  "User logged in successfully"
              )
          )
  
  });
  

  const logoutUser = asynchandler(async(req,res)=>{
          await  User.findByIdAndUpdate(
                req.user._id,
                { 
                    $set:{
                        refreshToken:undefined
                    }
                 },
                { new: true }
            )


            const options = {
                httpOnly:true,
                secure:true
            }

            return  res
                        .status(200)
                        .clearCookie('accessToken',options)
                        .clearCookie('refreshToken',options)
                        .json(new ApiResponse(200, {}, "user logged out suuceesfully"))
})

const refreshAccessToken = asynchandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 
    if(incomingRefreshToken) {
        throw new ApiErroor(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used");
            
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { loginUser, registerUser, logoutUser , refreshAccessToken};
