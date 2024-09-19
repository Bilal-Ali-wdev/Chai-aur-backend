import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    console.log("I am auth code");
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    console.log("Token Retrieved:", token);
    if (!token) {
      throw new ApiError(404, "Unauthorized Request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("decodedToken : ", decodedToken);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshtoken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});


export { verifyJwt };
