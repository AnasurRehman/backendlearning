import { User } from "../../models/playtube/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  const coverImageLocalPath = await req.files?.coverImage[0]?.path;

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

export { registerUser };
