import { db } from "./config/firebase";

async function testConnection() {
  try {
    // Try writing a test document
    await db.collection("test").doc("ping").set({
      message: "Hello from backend 🚀",
      timestamp: new Date(),
    });

    // Read it back
    const testDoc = await db.collection("test").doc("ping").get();

    console.log("Firestore connected ✅");
    console.log("Document exists:", testDoc.exists);
    console.log("Document data:", testDoc.data());

    process.exit(0);
  } catch (err) {
    console.error("Firestore connection failed ❌", err);
    process.exit(1);
  }
}

testConnection();
