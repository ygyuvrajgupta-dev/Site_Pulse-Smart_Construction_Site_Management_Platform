import cloudinaryLib from "cloudinary";
import env from "./env.js";

/**
 * Cloudinary configuration (media / file uploads).
 *
 * Pattern:
 *   1. Frontend requests signed upload params from GET /api/v1/uploads/cloudinary-sign.
 *   2. Frontend posts the file + params directly to Cloudinary's upload endpoint.
 *   3. Frontend persists the returned secure_url (file.service.uploadFile already
 *      accepts a URL — "e.g., from S3/Cloudinary upload").
 *
 * Safe when unconfigured: signing returns null and the route responds 503.
 */
const cloudinary = cloudinaryLib.v2;

const isConfigured = Boolean(
  env.cloudinary?.cloudName && env.cloudinary?.apiKey && env.cloudinary?.apiSecret
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Generate signed upload parameters for a direct (client-side) Cloudinary upload.
 * @param {Object} [options]
 * @param {string} [options.folder] - Cloudinary folder, e.g. "sitepulse/documents".
 * @param {string} [options.publicId] - Optional public id (without extension).
 * @returns {Object|null} `{ cloudName, apiKey, timestamp, signature, folder, publicId }`,
 *   or `null` when Cloudinary is not configured.
 */
export function getSignedUploadParams(options = {}) {
  if (!isConfigured) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: options.folder || "sitepulse" };
  if (options.publicId) {
    params.public_id = options.publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    env.cloudinary.apiSecret
  );

  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    signature,
    folder: params.folder,
    publicId: params.public_id,
  };
}

export default cloudinary;