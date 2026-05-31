import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';

const router = Router();

// Public endpoint - get current subscription config
router.get('/public-config', async (_req, res) => {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: 'PESAMATRIX_CONFIG' } });
    res.json({
      subscriptionFee: config?.subscriptionFee ?? 3000,
      subscriptionDays: config?.subscriptionDays ?? 30,
    });
  } catch {
    res.json({ subscriptionFee: 3000, subscriptionDays: 30 });
  }
});

router.use(authenticateToken, requireRole('ADMIN'));

router.get('/config', async (_req, res) => {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: 'PESAMATRIX_CONFIG' } });
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/killswitch', async (req: AuthRequest, res: Response) => {
  const { active } = req.body;
  const config = await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: { killSwitchActive: active },
    create: { id: 'PESAMATRIX_CONFIG', killSwitchActive: active },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: `GLOBAL_KILLSWITCH_SET:${active}` },
  });
  res.json({ status: 'Kill-switch updated', config });
});

router.post('/risk-parameters', async (req: AuthRequest, res: Response) => {
  const { maxSpread, maxVolatilityBonus } = req.body;
  const config = await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: { maxSpread, maxVolatilityBonus },
    create: { id: 'PESAMATRIX_CONFIG', maxSpread, maxVolatilityBonus },
  });
  res.json({ status: 'Risk parameters updated', config });
});

router.post('/subscription-config', async (req: AuthRequest, res: Response) => {
  const { subscriptionFee, subscriptionDays } = req.body;
  if (!subscriptionFee || !subscriptionDays) {
    return res.status(400).json({ error: 'subscriptionFee and subscriptionDays are required' });
  }
  const config = await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: { subscriptionFee: parseFloat(subscriptionFee), subscriptionDays: parseInt(subscriptionDays) },
    create: { id: 'PESAMATRIX_CONFIG', subscriptionFee: parseFloat(subscriptionFee), subscriptionDays: parseInt(subscriptionDays) },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: `SUBSCRIPTION_CONFIG_UPDATED:fee=${subscriptionFee},days=${subscriptionDays}` },
  });
  res.json({ status: 'Subscription configuration updated', config });
});

router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, subscriptions: { select: { status: true, expiresAt: true, planName: true, amount: true, days: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const AdminController = router;
