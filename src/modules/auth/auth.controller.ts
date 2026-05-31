import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid user credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, mustChangePassword: user.mustChangePassword },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.json({ token, mustChangePassword: user.mustChangePassword });
  } catch (error) {
    res.status(500).json({ error: 'Authentication routine failure' });
  }
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword, mustChangePassword: false },
    });
    res.json({ status: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password update operation failed' });
  }
});

export const AuthController = router;
