// API service for backend communication
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      // Try to get token from localStorage as fallback
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('User not authenticated');
      return token;
    }
    return await user.getIdToken(true); // Force refresh token
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      const url = `${API_BASE_URL}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.message.includes('admin access required')) {
        toast.error('Admin access required. Please login as admin.');
      } else if (error.message.includes('Authentication required')) {
        toast.error('Please login to continue.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  }

  // Auth APIs
  async loginWithEmail(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Application APIs
  async submitApplication(applicationData) {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getMyApplication() {
    return this.request('/api/applications/my-application');
  }

  async getAllApplications() {
    return this.request('/api/applications');
  }

  async updateApplicationStatus(uid, status) {
    return this.request(`/api/applications/${uid}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Student APIs
  async getAllStudents() {
    return this.request('/api/students');
  }

  async getMyProfile() {
    return this.request('/api/students/profile');
  }

  async updateMyProfile(profileData) {
    return this.request('/api/students/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getStudent(uid) {
    return this.request(`/api/students/${uid}`);
  }

  async updateStudent(uid, updateData) {
    return this.request(`/api/students/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async updateStudentStatus(uid, status) {
    return this.request(`/api/students/${uid}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updatePaymentStatus(uid, paymentStatus) {
    return this.request(`/api/students/${uid}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus }),
    });
  }

  async updateProgress(uid, progressPercentage) {
    return this.request(`/api/students/${uid}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progressPercentage }),
    });
  }

  async updateProgressStep(uid, step, completed) {
    return this.request(`/api/students/${uid}/progress-step`, {
      method: 'PUT',
      body: JSON.stringify({ step, completed }),
    });
  }

  // Payment APIs
  async applyCoupon(couponCode) {
    return this.request('/api/payments/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    });
  }

  async createPaymentOrder(couponCode) {
    return this.request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    });
  }

  async verifyPayment(paymentData) {
    return this.request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory() {
    return this.request('/api/payments/history');
  }

  // Document APIs
  async getMyDocuments() {
    return this.request('/api/documents/my-documents');
  }

  async getStudentDocuments(studentUid) {
    return this.request(`/api/documents/student/${studentUid}`);
  }

  async uploadDocument(studentUid, file, documentType) {
    const token = await this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await fetch(`${API_BASE_URL}/api/documents/upload/${studentUid}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  async updateDocumentStatus(documentId, enabled) {
    return this.request(`/api/documents/${documentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async deleteDocument(documentId) {
    return this.request(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Admin APIs
  async setAdminClaim(uid) {
    return this.request(`/api/admin/set-admin/${uid}`, {
      method: 'POST',
    });
  }

  async removeAdminClaim(uid) {
    return this.request(`/api/admin/remove-admin/${uid}`, {
      method: 'POST',
    });
  }

  async getUserClaims(uid) {
    return this.request(`/api/admin/user-claims/${uid}`);
  }

  // File Upload to Firebase Storage
  async uploadToFirebase(file, path) {
    const { storage } = await import('../config/firebase');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }
}

export default new ApiService();