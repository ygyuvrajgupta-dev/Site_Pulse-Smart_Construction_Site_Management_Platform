import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getDocuments,
  uploadDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  uploadFile,
} from "../services/document.service.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(protect);

// File upload endpoint
router.post("/upload", upload.single("file"), uploadFile);

// Folder routes
router.get("/folders", getFolders);
router.post("/folders", createFolder);
router.put("/folders/:id", updateFolder);
router.delete("/folders/:id", deleteFolder);

// Document routes
router.get("/documents", getDocuments);
router.post("/documents", upload.single("file"), uploadDocument);
router.get("/documents/:id", getDocument);
router.put("/documents/:id", updateDocument);
router.delete("/documents/:id", deleteDocument);

export default router;