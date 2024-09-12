import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, fullname, password } = req.body;
  console.log("Email : ", email);
  //   if (!username || !email || !fullname || !password) {
  //     res.status(400).json({
  //       message: "All Fields are required",
  //     });
  //     throw new ApiError(400,"All fields required",)
  //   }
  if (
    [username, email, fullname, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields are required");
  }
  const checkUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (checkUser) {
    throw new ApiError(
      409,
      "User already Exist with this email and username !"
    );
  }
  const avtarLocalpath = req.files?.avtar[0]?.path;
  const coverLocalpath = req.files?.coverimage[0]?.path;
  if(!avtarLocalpath){
    throw new ApiError(400,"Avtar file is required:-")
  }
  const avtar = await uploadOnCloudinary(avtarLocalpath)
  const coverimage = await uploadOnCloudinary(coverLocalpath)
  if(!avtar){
     throw new ApiError(400,"Avtar file is required")
  }
  const user = await User.create({
    fullname,
    avtar:avtar.url,
    coverimage:coverimage?.url || "",
    email,
    password,
    username:username.toLowerCase(),
  })
  const createdUser = await User.findById(user._id).select("-password -refreshtoken")
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering User")
  }
  return res.status(201).json(new ApiResponse(200,createdUser,"User Registered Successfully"))
//   await user.save()
});

export { registerUser };
