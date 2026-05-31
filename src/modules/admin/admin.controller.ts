import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken, requireRole('ADMIN'));

router.post('/killswitch', async (req: AuthRequest, res: Response) => {
  const { active } = req.body;
  
  const config = await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: { killSwitchActive: active },
    create: { id: 'PESAMATRIX_CONFIG', killSwitchActive: active }
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: `GLOBAL_KILLSWITCH_SET:${active}` }
  });

  res.json({ status: 'Emergency system configuration altered', config });
});

router.post('/risk-parameters', async (req: AuthRequest, res: Response) => {
  const { maxSpread, maxVolatilityBonus } = req.body;

  const config = await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: { maxSpread, maxVolatilityBonus },
    create: { id: 'PESAMATRIX_CONFIG', maxSpread, maxVolatilityBonus }
  });

  res.json({ status: 'Risk parameter bounds updated', config });
});

export const AdminController = router;
