import { Router } from "express";
import { getSignedUploadParams } from "../config/cloudinary.js";

const router = Router();

/**
 * GET /api/v1/uploads/cloudinary-sign
 * Returns signed upload parameters so the frontend can upload a file
 * directly to Cloudinary, then persist the returned secure_url.
 * Requires auth (mounted with `protect` in routes/v1/index.js).
 */
router.get("/cloudinary-sign", (req, res, next) => {
  try {
    const params = getSignedUploadParams({
      folder: typeof req.query.folder === "string" ? req.query.folder : undefined,
    });

    if (!params) {
      return res.status(503).json({
        success: false,
        message:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cloudinary upload parameters generated",
      data: params,
    });
  } catch (error) {
    next(error);
  }
});

export default router;