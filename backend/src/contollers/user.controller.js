import { asyncHandler } from "../utils/asyncHandler.js";

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
});

export { registerUser };
