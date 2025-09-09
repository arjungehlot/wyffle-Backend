import express from "express";
import multer from "multer";
import { DocumentService } from "../services/documentService";
import {
  verifyToken,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = express.Router();
const documentService = new DocumentService();

// Allowed document types
type DocumentType = "offer_letter" | "invoice" | "certificate" | "project_portfolio";
const allowedTypes: DocumentType[] = ["offer_letter", "invoice", "certificate", "project_portfolio"];

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/zip",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Accept a single file field named 'file'
const uploadSingle = upload.single("file");

// 📌 Upload document (Admin only)
router.post(
  "/upload/:studentUid",
  verifyToken,
  requireAdmin,
  uploadSingle,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { studentUid } = req.params;
      const uploadedBy = req.user!.uid;
      const { documentType } = req.body as { documentType: DocumentType };

      // Validate document type
      if (!documentType || !allowedTypes.includes(documentType)) {
        return res.status(400).json({ success: false, error: "Invalid document type" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const fileUrl = await documentService.uploadDocument(
        studentUid,
        documentType, // use documentType from body
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        uploadedBy
      );

      res.json({ success: true, message: "Document uploaded successfully", fileUrl });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ success: false, error: "Failed to upload document" });
    }
  }
);

// 📌 Get current user's documents
router.get("/my-documents", verifyToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const documents = await documentService.getStudentDocuments(uid);
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ success: false, error: "Failed to fetch documents" });
  }
});

// 📌 Get documents for a student (Admin only)
router.get("/student/:studentUid", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { studentUid } = req.params;
    const documents = await documentService.getStudentDocuments(studentUid);
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error("Error fetching student documents:", error);
    res.status(500).json({ success: false, error: "Failed to fetch student documents" });
  }
});

// 📌 Enable/disable document (Admin only)
router.put("/:documentId/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { enabled } = req.body;
    await documentService.enableDocument(documentId, enabled);
    res.json({
      success: true,
      message: `Document ${enabled ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    res.status(500).json({ success: false, error: "Failed to update document status" });
  }
});

// 📌 Delete document (Admin only)
router.delete("/:documentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    await documentService.deleteDocument(documentId);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ success: false, error: "Failed to delete document" });
  }
});

export default router;
