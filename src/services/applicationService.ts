import { db } from '../config/firebase';
import { ApplicationData, StudentData } from '../types';

function cleanData(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}


export class ApplicationService {
  private applicationsCollection = db.collection('applications');
  private studentsCollection = db.collection('students');

  async createApplication(uid: string, applicationData: Omit<ApplicationData, 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const application: ApplicationData = {
        uid,
        ...applicationData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.applicationsCollection.doc(uid).set(application);
      console.log(`Application created for user: ${uid}`);
      return uid;
    } catch (error) {
      console.error('Error creating application:', error);
      throw new Error('Failed to create application');
    }
  }

  async getApplication(uid: string): Promise<ApplicationData | null> {
    try {
      const doc = await this.applicationsCollection.doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as ApplicationData;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw new Error('Failed to fetch application');
    }
  }

  async getApplicationById(id: string): Promise<ApplicationData | null> {
    try {
      const doc = await this.applicationsCollection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as ApplicationData;
    } catch (error) {
      console.error('Error fetching application by ID:', error);
      throw new Error('Failed to fetch application by ID');
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

  async updateApplicationStatus(uid: string, status: ApplicationData['status']): Promise<void> {
    try {
      await this.applicationsCollection.doc(uid).update({
        status,
        updatedAt: new Date()
      });

      // If shortlisted, create student record
      if (status === 'shortlisted') {
        await this.shortlistStudent(uid);
      }

      console.log(`Application status updated for user: ${uid} to ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  private async shortlistStudent(uid: string): Promise<void> {
  try {
    const application = await this.getApplication(uid);
    if (!application) {
      throw new Error('Application not found');
    }

    const studentData: StudentData = {
      uid,
      applicationId: uid,
      fullName: application.fullName,
      email: application.email,
      phoneNo: application.phoneNo,
      dateOfBirth: application.dateOfBirth,
      location: application.location,
      college: application.college,
      degree: application.degree,
      yearOfGraduation: application.yearOfGraduation,
      skills: application.skills,
      interestedFields: application.interestedFields,
      resumeFileUrl: application.resumeFileUrl || undefined, // 👈 safe
      resumeLink: application.resumeLink || undefined,      // 👈 safe
      motivation: application.motivation,
      availability: application.availability,
      source: application.source,

      // Student-specific fields
      activeDays: 0,
      projectsBuilt: 0,
      progressPercentage: 0,
      internshipStatus: 'inactive',
      status: 'shortlisted',
      paymentStatus: 'pending',

      progressSteps: {
        applicationSubmitted: true,
        resumeShortlisted: true,
        interviewCompleted: false,
        paymentProcess: false,
        internshipActive: false,
        finalShowcase: false,
        certificateReady: false
      },

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save clean data
    await this.studentsCollection.doc(uid).set(cleanData(studentData));

    console.log(`Student record created for user: ${uid}`);
  } catch (error) {
    console.error('Error creating student record:', error);
    throw new Error('Failed to create student record');
  }
}

}