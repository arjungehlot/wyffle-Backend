import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    isAdmin?: boolean;
  };
}

// Admin UID (you provided)
const ADMIN_UID = '9YpHtiFsu2gwspHZgFrp5DFPAFJ3';

// Middleware to verify Firebase ID token - NUCLEAR OPTION
export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // NUCLEAR OPTION: Manually extract all properties
    const tokenString = JSON.stringify(decodedToken);
    const tokenObj = JSON.parse(tokenString);
    
    console.log('=== NUCLEAR DEBUG ===');
    console.log('Token string:', tokenString);
    console.log('Parsed token object:', tokenObj);
    
    // Check every possible way the admin claim could exist
    let isAdmin = false;
    
    // 1. Check direct property
    if (tokenObj.admin === true) {
      isAdmin = true;
      console.log('Admin found: direct property');
    }
    // 2. Check UID match
    else if (decodedToken.uid === ADMIN_UID) {
      isAdmin = true;
      console.log('Admin found: UID match');
    }
    // 3. Check for claims object
    else if (tokenObj.claims && tokenObj.claims.admin === true) {
      isAdmin = true;
      console.log('Admin found: claims object');
    }
    // 4. Check for customClaims object
    else if (tokenObj.customClaims && tokenObj.customClaims.admin === true) {
      isAdmin = true;
      console.log('Admin found: customClaims object');
    }

    console.log('Final isAdmin:', isAdmin);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: isAdmin,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
// Middleware to require authentication
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.uid) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to require admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('=== ADMIN CHECK DEBUG ===');
  console.log('Checking admin access for user:', req.user?.email);
  console.log('User UID:', req.user?.uid);
  console.log('Is Admin:', req.user?.isAdmin);
  console.log('=========================');
  
  if (!req.user?.isAdmin) {
    console.log('❌ ADMIN ACCESS DENIED');
    return res.status(403).json({ 
      error: 'Admin access required',
      details: 'Your account does not have administrator privileges'
    });
  }
  
  console.log('✅ ADMIN ACCESS GRANTED');
  next();
};