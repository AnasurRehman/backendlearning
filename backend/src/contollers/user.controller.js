import { User } from "../../models/playtube/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessandRereshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

//post routes

const registerUser = asyncHandler(async (req, res) => {
  // get user details
  // validation
  // check if user exists : email,
  // avatar avail  or images ?
  // if image avail ten upload to cloudinary
  // create user obj - crete entry in db
  // remove password and refresh token from response
  // check for user creation
  // return res if created

  const { userName, email, fullName, password } = req.body;

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }
  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "Email or Username already exists");
  }
  const avatarLocalPath = await req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = await req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const userRes = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    userName: userName.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(userRes?._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong");
  }

  return res
    .status(201)
    .json(new ApiResonse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get email, username, password from req.body
  //if none provided then return error
  //check for password validity using bcrypt method
  //generate access and refresh token
  //send res with access and refresh token

  const { email, password, userName } = req.body;

  const user = await User.findOne({ $or: [{ userName }, { email }] });

  if (!(userName || email)) {
    throw new ApiError(401, "Username or Email is required");
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordValidation = await user.isPasswordCorrect(password);

  if (!passwordValidation) {
    throw new ApiError(404, "Incorrect password");
  }
  const { refreshToken, accessToken } = await generateAccessandRereshToken(
    user
  );

  const { password: _, refreshToken: __, ...sanctionedUser } = user.toObject();

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResonse(
        200,
        { user: sanctionedUser, refreshToken, accessToken },
        "Login Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResonse(200, {}, "User logged out successfully"));
});

const refreshAceessToken = asyncHandler(async (req, res) => {
  //get refresh token
  //verify token from jwt
  //get user from decoded token
  //check if incoming token equals users refresh token
  // if so then generate new refresh token and send res
  // check for error in every step

  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingToken) {
    throw new ApiError(400, "Token not found");
  }

  const decodedToken = await jwt.verify(
    incomingToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decodedToken) {
    throw new ApiError(409, "Invalid Token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (incomingToken !== user?.refreshToken) {
    throw new ApiError(400, "Refresh Token is invalid");
  }

  const { accessToken, refreshToken } = await generateAccessandRereshToken(
    user
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResonse(
        200,
        { refreshToken, accessToken },
        "Token Refreshed Successfully"
      )
    );
});

//get routes

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResonse(200, res.user));
});

//edit routes

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!(oldPassword && newPassword)) {
      throw new ApiError(400, "Both fields are required");
    }

    const isPasswordValid = user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      throw new ApiError(400, "Old password is incorrect");
    }

    const user = await User.findById(req.user?._id);

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiError(200, {}, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResonse(200, user, "User updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(500, "Error uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResonse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file?.path;

  if (!coverImgLocalPath) {
    throw new ApiError(400, "coverImg image not found");
  }

  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  if (!coverImg?.url) {
    throw new ApiError(500, "Error uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImg.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResonse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAceessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUser,
  updateAvatar,
  updateCoverImage,
};
