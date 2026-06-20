import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export const removeImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete Cloudinary image: ${publicId}`, error);
    // Continuing because we don't want to break the user flow if standard cleanup fails occasionally
  }
};

export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex !== -1) {
      const versionRegex = /^v\d+$/;
      let startIndex = uploadIndex + 1;
      if (versionRegex.test(parts[startIndex])) {
        startIndex++;
      }
      const idParts = parts.slice(startIndex);
      const fullId = idParts.join('/');
      const dotIndex = fullId.lastIndexOf('.');
      return dotIndex !== -1 ? fullId.slice(0, dotIndex) : fullId;
    }
    return null;
  } catch (err) {
    return null;
  }
};

// We don't implement direct file uploads in this service since standard Express multi-part
// would use multer, and the files might be uploaded via presigned URLs directly from client
// or via an admin upload endpoint. If they go via API, we'd use multer + cloudinary stream.
// Since the prompt does not specify a file upload middleware (like multer), we will leave
// a helper to delete. Client handles upload or we add upload later if requested.
