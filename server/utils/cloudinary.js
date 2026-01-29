import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export async function uploadImage(dataUri, folder = "hr-nexus/profiles") {
  if (!dataUri) return null;
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder,
    overwrite: true,
    invalidate: true,
    transformation: [{ width: 512, height: 512, crop: "limit" }],
  });
  return uploadResult?.secure_url || null;
}
