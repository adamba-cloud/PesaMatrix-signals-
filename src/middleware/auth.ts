import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; mustChangePassword: boolean };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access Denied: Token Missing' });

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token Expired or Invalid' });
    req.user = user as AuthRequest['user'];
    if (req.user?.mustChangePassword && req.path !== '/change-password') {
      return res.status(403).json({ error: 'Password change enforcement active.' });
    }
    next();
  });
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Permission Denied' });
    next();
  };
}
