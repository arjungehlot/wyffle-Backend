import { db, bucket } from "../config/firebase"; // ✅ bucket is now exported
import { DocumentData } from "../types";
import { File } from "@google-cloud/storage";
import { Bucket } from "@google-cloud/storage";
import {
  CollectionReference,
  DocumentData as FirestoreDocData,
} from "firebase-admin/firestore";

export class DocumentService {
  private documentsCollection: CollectionReference<FirestoreDocData>;
  private bucket: Bucket;

  constructor() {
    this.documentsCollection = db.collection("documents");
    this.bucket = bucket; // ✅ always use the configured bucket
  }

  async uploadDocument(
    studentUid: string,
    documentType: DocumentData["documentType"],
    file: Buffer,
    fileName: string,
    mimeType: string,
    uploadedBy: string
  ): Promise<string> {
    try {
      const filePath = `documents/${studentUid}/${documentType}/${fileName}`;
      const fileRef: File = this.bucket.file(filePath);

      await fileRef.save(file, {
        metadata: {
          contentType: mimeType,
        },
      });

      const [fileUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // far future date
      });

      const documentData: DocumentData = {
        uid: studentUid,
        studentId: studentUid,
        documentType,
        fileName,
        fileUrl,
        fileSize: file.length,
        mimeType,
        uploadedBy,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = this.documentsCollection.doc();
      await docRef.set(documentData);

      console.log(
        `✅ Document uploaded for student: ${studentUid}, type: ${documentType}`
      );
      return fileUrl;
    } catch (error) {
      console.error("❌ Error uploading document:", error);
      throw new Error("Failed to upload document");
    }
  }

  async getStudentDocuments(studentUid: string): Promise<DocumentData[]> {
    try {
      const snapshot = await this.documentsCollection
        .where("uid", "==", studentUid)
        .where("isEnabled", "==", true)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<DocumentData, "id">;
        return { id: doc.id, ...data };
      });
    } catch (error) {
      console.error("❌ Error fetching student documents:", error);
      throw new Error("Failed to fetch documents");
    }
  }

  async enableDocument(documentId: string, enabled: boolean): Promise<void> {
    try {
      await this.documentsCollection.doc(documentId).update({
        isEnabled: enabled,
        updatedAt: new Date(),
      });
      console.log(
        `✅ Document ${documentId} ${enabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("❌ Error updating document status:", error);
      throw new Error("Failed to update document status");
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const doc = await this.documentsCollection.doc(documentId).get();
      if (!doc.exists) throw new Error("Document not found");

      const documentData = doc.data() as DocumentData;
      if (!documentData) throw new Error("Invalid document data");

      // Delete from storage
      const filePath = `documents/${documentData.studentId}/${documentData.documentType}/${documentData.fileName}`;
      await this.bucket.file(filePath).delete();

      // Delete from Firestore
      await this.documentsCollection.doc(documentId).delete();

      console.log(`✅ Document deleted: ${documentId}`);
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      throw new Error("Failed to delete document");
    }
  }
}
