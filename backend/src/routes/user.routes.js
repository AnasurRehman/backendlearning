import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAceessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
  updateUser,
} from "../contollers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
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

router.route("/login").post(loginUser);

//secured routes

//post routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAceessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

//get routes
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

//patch routes
router.route("/update-account").patch(verifyJWT, updateUser);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImg"), updateCoverImage);
router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImg"), updateCoverImage);

export default router;
