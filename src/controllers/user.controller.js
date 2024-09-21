import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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
      $set: {
        refreshtoken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  console.log("user logged out");
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookie.refreshtoken || req.body.refreshtoken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded Token : ", decodedToken);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incommingRefreshToken !== user?.refreshtoken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const option = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accesstoken", accessToken, option)
      .cookie("refreshToken", newrefreshtoken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshtoken: newrefreshToken },
          "AccessToken Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "Confirm Password not matched");
  }
  const user = await User.findById(req.user?._id);
  const isPassCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPassCorrect) {
    throw new ApiError(400, "Invalid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current User fetched Successfully");
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshtoken");
  return res
    .status(200)
    .json(
      new ApiResponse(201, { user }, "Account Detail Updated Successfully")
    );
});

const updateAvtarFile = asyncHandler(async (req, res) => {
  const avtarLocalPath = req.file?.path;
  if (!avtarLocalPath) {
    throw new ApiError(400, "Avtar File is reqired");
  }
  const avtar = await uploadOnCloudinary(avtarLocalPath);
  if (!avtar.url) {
    throw new ApiError(400, "Error while uploading on avtar");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avtar: avtar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshtoken");
  return res
    .status(201)
    .json(new ApiResponse(200, {user}, "Avtar file updated successfully"));
});

const updateCoverFile = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Coverimage file is missing")
  }
  const coverimage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverimage){
    throw new ApiError(400,"Cover image find error while uploading ")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set:{
      coverimage:coverimage.url
    },
  },
    {
      new:true
    }
  ).select("-password -refreshtoken")
  return res.status(200).json(new ApiResponse(201,{user},"Cover Image updated successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateAvtarFile,
  updateCoverFile
};
