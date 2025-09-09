import { db } from '../config/firebase';
import { StudentData } from '../types';

export class StudentService {
  private studentsCollection = db.collection('students');

  async getStudent(uid: string): Promise<StudentData | null> {
    try {
      const doc = await this.studentsCollection.doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as StudentData;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw new Error('Failed to fetch student');
    }
  }

  async getAllStudents(): Promise<StudentData[]> {
    try {
      const snapshot = await this.studentsCollection.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data() as StudentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  async updateStudent(uid: string, updateData: Partial<StudentData>): Promise<void> {
    try {
      await this.studentsCollection.doc(uid).set(
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { merge: true } 
      );
      console.log(`Student updated: ${uid}`);
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  async updateStudentStatus(uid: string, status: StudentData['status']): Promise<void> {
    try {
      await this.studentsCollection.doc(uid).set(
        {
          status,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`Student status updated for user: ${uid} to ${status}`);
    } catch (error) {
      console.error('Error updating student status:', error);
      throw new Error('Failed to update student status');
    }
  }

  async updatePaymentStatus(uid: string, paymentStatus: StudentData['paymentStatus']): Promise<void> {
    try {
      const updateData: any = {
        paymentStatus,
        updatedAt: new Date(),
      };

      // Update progress steps if payment is successful
      if (paymentStatus === 'paid') {
        updateData['progressSteps.paymentProcess'] = true;
        updateData['progressSteps.internshipActive'] = true;
        updateData.internshipStatus = 'active';
        updateData.status = 'active';
      }

      await this.studentsCollection.doc(uid).set(updateData, { merge: true });
      console.log(`Payment status updated for user: ${uid} to ${paymentStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }

  async updateProgress(uid: string, progressPercentage: number): Promise<void> {
    try {
      await this.studentsCollection.doc(uid).set(
        {
          progressPercentage,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`Progress updated for user: ${uid} to ${progressPercentage}%`);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Failed to update progress');
    }
  }

  async updateProgressStep(
    uid: string,
    step: keyof StudentData['progressSteps'],
    completed: boolean
  ): Promise<void> {
    try {
      await this.studentsCollection.doc(uid).set(
        {
          [`progressSteps.${step}`]: completed,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`Progress step updated for user: ${uid}, step: ${step}, completed: ${completed}`);
    } catch (error) {
      console.error('Error updating progress step:', error);
      throw new Error('Failed to update progress step');
    }
  }
}
