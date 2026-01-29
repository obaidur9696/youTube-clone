import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import "dotenv/config";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    await fs.unlink(localFilePath);
    return response;

  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch (_) { }
    throw new ApiError(500, error.message || "Failed to upload file to Cloudinary");
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(500, error.message || "Cloudinary delete failed:");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };