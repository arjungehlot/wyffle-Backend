import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    isAdmin: boolean;
  };
}

// ✅ Hardcoded Admin UID (make this your main admin account)
const ADMIN_UID = '9YpHtiFsu2gwspHZgFrp5DFPAFJ3';

// ===================== Middleware =====================

// Verify Firebase ID token
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Firebase
    const decodedToken = await auth.verifyIdToken(token);

    // ✅ Determine admin role
    let isAdmin = false;

    // Option 1: Match hardcoded UID
    if (decodedToken.uid === ADMIN_UID) {
      isAdmin = true;
    }

    // Option 2: If Firebase custom claims are ever set
    if ((decodedToken as any).admin === true) {
      isAdmin = true;
    }

    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Require authentication
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.uid) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Require admin
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      details: 'Your account does not have administrator privileges',
    });
  }
  next();
};
