import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshtoken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access And RefreshToken"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;
  console.log("Req.body : ", req.body);
  if (!username || !email || !fullname || !password) {
    throw new ApiError(400, "All fields required");
  }
  //   if (
  //     [username, email, fullname, password].some(
  //       (fields) => fields?.trim() === ""
  //     )
  //   ) {
  //     throw new ApiError(400, "All Fields are required");
  //   }
  const checkUserdublicate = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (checkUserdublicate) {
    throw new ApiError(409, "User already Exist with this email and username");
  }
  if (!req.files || !req.files.avtar || !req.files.avtar[0]) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avtarLocalpath = req.files?.avtar[0]?.path;
  //   const coverLocalpath = req.files?.coverimage[0]?.path;
  let coverLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverLocalpath = req.files.coverimage[0].path;
  }
  if (!avtarLocalpath) {
    throw new ApiError(400, "Avtar file is required:-");
  }
  const avtar = await uploadOnCloudinary(avtarLocalpath);
  const coverimage = await uploadOnCloudinary(coverLocalpath);
  if (!avtar) {
    throw new ApiError(400, "Avtar file is required");
  }
  const user = await User.create({
    fullname,
    avtar: avtar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering User");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "email is required");
  }
  const user = await User.findOne({ email });


  if (!user) {
    throw new ApiError(404, "User not exist in database");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password Incorrect || Invalid user credential");
  }
  //if password correct so generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: LoggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
     await User.findByIdAndUpdate(
        req.user._id,
       {
        $set:{
            refreshtoken:undefined,
        }
       },
       {
        new : true
       }
    )
    const option = {
        httpOnly: true,
        secure: true,
      };
      console.log("user logged out");
      return res.status(200)
      .clearCookie("accessToken",option)
      .clearCookie("refreshToken",option)
      .json(new ApiResponse(200,{},"User Logout Successfully"))
});
export { registerUser, loginUser, logoutUser };
