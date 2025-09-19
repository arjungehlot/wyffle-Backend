import { db } from '../config/firebase';
import { ApplicationData, StudentData } from '../types';

function cleanData(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
}

export class ApplicationService {
  private applicationsCollection = db.collection('applications');
  private studentsCollection = db.collection('students');

  async createApplication(
    uid: string,
    applicationData: Omit<ApplicationData, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> {
    try {
      const docRef = this.applicationsCollection.doc(); // 🔹 auto-ID instead of uid
      const application: ApplicationData = {
        id: docRef.id,
        uid,
        ...applicationData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await docRef.set(application);
      console.log(`Application created for user: ${uid}, docId: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw new Error('Failed to create application');
    }
  }


 async getApplicationById(id: string): Promise<ApplicationData | null> {
  try {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid document ID");
    }

    const doc = await this.applicationsCollection.doc(id).get();
    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() } as ApplicationData;
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    throw new Error("Failed to fetch application by ID");
  }
}


  async getApplication(uid: string): Promise<ApplicationData | null> {
    try {
      const snapshot = await this.applicationsCollection.where('uid', '==', uid).limit(1).get();
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as ApplicationData;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw new Error('Failed to fetch application');
    }
  }

  async getAllApplications(): Promise<ApplicationData[]> {
    try {
      const snapshot = await this.applicationsCollection.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationData));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  async updateApplication(id: string, updateData: Partial<ApplicationData>): Promise<void> {
    try {
      await this.applicationsCollection.doc(id).update({
        ...updateData,
        updatedAt: new Date()
      });
      console.log(`Application updated for ID: ${id}`);
    } catch (error) {
      console.error('Error updating application:', error);
      throw new Error('Failed to update application');
    }
  }

  async updateApplicationStatus(id: string, status: ApplicationData['status']): Promise<void> {
    try {
      await this.applicationsCollection.doc(id).update({
        status,
        updatedAt: new Date()
      });
      if (status === 'shortlisted') {
        await this.shortlistStudent(id);
      }

      console.log(`Application status updated for ID: ${id} to ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

private async shortlistStudent(applicationId: string): Promise<void> {
  try {
    const application = await this.getApplicationById(applicationId);
    if (!application) throw new Error("Application not found");

    console.log("Fetched application:", application);

    const studentData: StudentData = {
      uid: application.userId ?? application.uid ?? "",
      applicationId,
      fullName: application.fullName || "",
      email: application.email || "",
      phoneNo: application.phoneNo || "",
      dateOfBirth: application.dateOfBirth || "",
      location: application.location || "",
      college: application.college || "",
      degree: application.degree || "",
      yearOfGraduation:
        typeof application.yearOfGraduation === "number"
          ? application.yearOfGraduation
          : Number(application.yearOfGraduation) || 0,
      skills: application.skills || [],
      interestedFields: application.interestedFields || [],
      resumeFileUrl: application.resumeFileUrl || undefined,
      resumeLink: application.resumeLink || undefined,
      motivation: application.motivation || "",
      availability: application.availability || "",
      source: application.source || "",

      activeDays: 0,
      projectsBuilt: 0,
      progressPercentage: 0,
      internshipStatus: "inactive",
      status: "shortlisted",
      paymentStatus: "pending",

      progressSteps: {
        applicationSubmitted: true,
        resumeShortlisted: true,
        interviewCompleted: false,
        paymentProcess: false,
        internshipActive: false,
        finalShowcase: false,
        certificateReady: false,
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Prepared studentData:", studentData);

    if (!application.userId && !application.uid) {
      throw new Error("Application UID is missing");
    }

    const docRef = await db.collection("students").add(cleanData(studentData));
    console.log(`✅ Student record created with ID: ${docRef.id}`);
  } catch (error: any) {
    console.error("❌ Error creating student record:", error.message, error.stack);
    throw new Error("Failed to create student record");
  }
}
}
