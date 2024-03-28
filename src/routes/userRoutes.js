import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/userControllers.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

const userRouter = Router();

userRouter.route("/hello").get((req, res) => {
  res.status(200).json({ message: "Hello" });
});

// Define route for user registration
userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  registerUser
);

userRouter.route("/login").post(loginUser);

//secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);

userRouter.route("/refresh-token").post(refreshAccessToken);

userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);

userRouter.route("/uppdate-account").patch(verifyJWT);

userRouter
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

userRouter
  .route("/cover-Image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile);

userRouter.route("/history").get(verifyJWT, getWatchHistory);

export default userRouter;
