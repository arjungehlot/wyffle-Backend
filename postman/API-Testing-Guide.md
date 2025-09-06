# Wyffle Backend API Testing Guide

## Prerequisites

1. **Install Postman**: Download from [postman.com](https://www.postman.com/downloads/)
2. **Start Backend Server**: Ensure your backend is running on `http://localhost:3000`
3. **Firebase Setup**: Have Firebase project configured with authentication

## Step-by-Step Testing Guide

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Wyffle-Backend-APIs.postman_collection.json`
5. Click **Import**

### Step 2: Set Up Environment Variables

1. Click on **Environments** (left sidebar)
2. Click **Create Environment**
3. Name it "Wyffle Local"
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `firebase_token` | `` | `[Your Firebase ID Token]` |
| `user_uid` | `` | `[Test User UID]` |
| `admin_uid` | `` | `[Admin User UID]` |
| `document_id` | `` | `[Document ID from responses]` |

5. Click **Save**
6. Select "Wyffle Local" environment (top right dropdown)

### Step 3: Get Firebase Authentication Token

#### Option A: Using Firebase Console
1. Go to Firebase Console → Authentication
2. Create a test user or use existing user
3. Use Firebase SDK in a test app to get ID token:

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
signInWithEmailAndPassword(auth, 'test@example.com', 'password')
  .then((userCredential) => {
    return userCredential.user.getIdToken();
  })
  .then((token) => {
    console.log('Firebase Token:', token);
  });
```

#### Option B: Using Firebase CLI
```bash
firebase auth:export users.json
# Use the UID from exported users
```

### Step 4: Update Environment Variables

1. Copy the Firebase ID token
2. Go to Postman → Environments → "Wyffle Local"
3. Paste token in `firebase_token` current value
4. Add user UID in `user_uid` current value
5. Click **Save**

### Step 5: Test APIs in Order

#### 5.1 Health Check (No Auth Required)
- **Request**: `GET /health`
- **Expected**: `200 OK` with system status
- **Purpose**: Verify server is running

#### 5.2 Submit Application
- **Request**: `POST /api/applications`
- **Auth**: Required (Bearer token)
- **Body**: JSON with application data
- **Expected**: `201 Created` with application ID
- **Note**: This creates the initial application

#### 5.3 Get My Application
- **Request**: `GET /api/applications/my-application`
- **Auth**: Required
- **Expected**: `200 OK` with application data
- **Purpose**: Verify application was saved

#### 5.4 Admin Operations (Requires Admin Token)

**Set Admin Claim First:**
- **Request**: `POST /api/admin/set-admin/{uid}`
- **Auth**: Required (existing admin)
- **Purpose**: Grant admin privileges

**Get All Applications:**
- **Request**: `GET /api/applications`
- **Auth**: Admin required
- **Expected**: Array of all applications

**Shortlist Student:**
- **Request**: `PUT /api/applications/{uid}/status`
- **Body**: `{"status": "shortlisted"}`
- **Expected**: Creates student record automatically

#### 5.5 Student Operations

**Get Student Profile:**
- **Request**: `GET /api/students/profile`
- **Auth**: Required
- **Expected**: Student profile data

**Update Profile:**
- **Request**: `PUT /api/students/profile`
- **Body**: Profile update data
- **Expected**: `200 OK` with success message

#### 5.6 Payment Operations

**Apply Coupon:**
- **Request**: `POST /api/payments/apply-coupon`
- **Body**: `{"couponCode": "TOP100"}`
- **Expected**: Discount calculation

**Create Payment Order:**
- **Request**: `POST /api/payments/create-order`
- **Body**: `{"couponCode": "TOP100"}` (optional)
- **Expected**: Razorpay order details
- **Note**: Requires student to be shortlisted

#### 5.7 Document Operations

**Upload Document (Admin):**
- **Request**: `POST /api/documents/upload/{studentUid}`
- **Body**: Form-data with file and documentType
- **Expected**: File URL and document ID

**Get My Documents:**
- **Request**: `GET /api/documents/my-documents`
- **Expected**: Array of enabled documents

### Step 6: Testing Scenarios

#### Scenario 1: Complete Student Journey
1. Submit application
2. Admin shortlists student
3. Student applies coupon
4. Student creates payment order
5. Student verifies payment (mock)
6. Admin uploads offer letter
7. Student views documents

#### Scenario 2: Admin Management
1. Get all applications
2. Update application status
3. Get all students
4. Update student progress
5. Upload documents
6. Manage document visibility

#### Scenario 3: Error Testing
1. Test without authentication token
2. Test with invalid data
3. Test unauthorized operations
4. Test non-existent resources

### Step 7: Common Issues & Solutions

#### Authentication Errors (401)
- **Issue**: Invalid or expired Firebase token
- **Solution**: Generate new token and update environment

#### Permission Errors (403)
- **Issue**: User lacks required permissions
- **Solution**: Ensure admin claims are set correctly

#### Validation Errors (400)
- **Issue**: Invalid request data
- **Solution**: Check request body format and required fields

#### Server Errors (500)
- **Issue**: Backend configuration or database issues
- **Solution**: Check server logs and environment variables

### Step 8: Automated Testing

Create test scripts in Postman:

```javascript
// Test script for successful responses
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});

// Save response data for next requests
pm.test("Save user data", function () {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.uid) {
        pm.environment.set("user_uid", jsonData.data.uid);
    }
});
```

### Step 9: Environment Setup for Different Stages

Create separate environments for:
- **Local Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.wyffle.com`
- **Production**: `https://api.wyffle.com`

### Step 10: Monitoring & Logging

1. Check server console for logs
2. Monitor Firebase Console for database changes
3. Use Postman Console for request/response debugging
4. Set up collection runner for automated testing

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | None | Health check |
| POST | `/api/applications` | User | Submit application |
| GET | `/api/applications/my-application` | User | Get user's application |
| GET | `/api/applications` | Admin | Get all applications |
| PUT | `/api/applications/{uid}/status` | Admin | Update application status |
| GET | `/api/students` | Admin | Get all students |
| GET | `/api/students/profile` | User | Get user's profile |
| PUT | `/api/students/profile` | User | Update user's profile |
| GET | `/api/students/{uid}` | Admin | Get specific student |
| PUT | `/api/students/{uid}` | Admin | Update student |
| PUT | `/api/students/{uid}/status` | Admin | Update student status |
| PUT | `/api/students/{uid}/payment-status` | Admin | Update payment status |
| PUT | `/api/students/{uid}/progress` | Admin | Update progress |
| PUT | `/api/students/{uid}/progress-step` | Admin | Update progress step |
| POST | `/api/payments/create-order` | User | Create payment order |
| POST | `/api/payments/verify` | User | Verify payment |
| GET | `/api/payments/history` | User | Get payment history |
| POST | `/api/payments/apply-coupon` | User | Apply coupon |
| POST | `/api/documents/upload/{uid}` | Admin | Upload document |
| GET | `/api/documents/my-documents` | User | Get user's documents |
| GET | `/api/documents/student/{uid}` | Admin | Get student documents |
| PUT | `/api/documents/{id}/status` | Admin | Enable/disable document |
| DELETE | `/api/documents/{id}` | Admin | Delete document |
| POST | `/api/admin/set-admin/{uid}` | Admin | Set admin claim |
| POST | `/api/admin/remove-admin/{uid}` | Admin | Remove admin claim |
| GET | `/api/admin/user-claims/{uid}` | Admin | Get user claims |

## Tips for Effective Testing

1. **Test in sequence**: Follow the user journey flow
2. **Use variables**: Store IDs and tokens in environment variables
3. **Check responses**: Verify both success and error responses
4. **Test edge cases**: Invalid data, unauthorized access, etc.
5. **Monitor logs**: Keep an eye on server console output
6. **Document issues**: Note any bugs or unexpected behavior
7. **Automate**: Use Postman's test scripts and collection runner