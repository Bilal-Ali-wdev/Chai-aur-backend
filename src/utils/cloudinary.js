import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //filesystem

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //if file exist upload on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, () => {
      resource_type: "auto";
    });
    console.log("Response is : ", res);
    //file has been upladed successfully
    console.log("File is uploaded in cloudinary",  res.url);
    // fs.unlinkSync(localFilePath)
    fs.unlinkSync(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File successfully deleted");
      }
    });
    console.log("File unlink successfylly : ")
    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation failed
    return null
  }
};

export {uploadOnCloudinary}
