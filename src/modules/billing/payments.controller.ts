import { Router } from 'express';
import { MpesaService } from './mpesa.service';
import { prisma } from '../../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── User: Initiate STK Push ──────────────────────────────────────────────────
router.post('/stk', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber, amount, days } = req.body;
    const userId = req.user!.id;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'phoneNumber and amount are required' });
    }

    // Validate Kenyan phone format 254XXXXXXXXX
    const phone = String(phoneNumber).replace(/\s+/g, '');
    if (!/^254[17]\d{8}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be in format 254XXXXXXXXX (e.g. 254712345678)' });
    }

    const result = await MpesaService.initiateStkPush(
      userId,
      Number(amount),
      phone,
      Number(days) || 30
    );

    res.json({
      message: 'STK Push sent. Check your phone.',
      CheckoutRequestID: result.CheckoutRequestID,
      CustomerMessage: result.CustomerMessage,
    });
  } catch (err: any) {
    console.error('[STK Push Error]', err.response?.data || err.message);
    const mpesaMsg = err.response?.data?.errorMessage || err.message;
    res.status(500).json({ error: mpesaMsg || 'Failed to initiate M-Pesa payment' });
  }
});

// ── Safaricom Callback (no auth — called by Safaricom servers) ───────────────
router.post('/mpesa-callback', async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body?.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback payload' });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = Body.stkCallback;
    const mpesaRef = CallbackMetadata?.Item?.find(
      (i: any) => i.Name === 'MpesaReceiptNumber'
    )?.Value;

    // Try BullMQ queue first (when Redis is available), else process directly
    let queued = false;
    try {
      const { Queue } = await import('bullmq');
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      const billingQueue = new Queue('billing-queue', { connection: { url: redisUrl } });
      await billingQueue.add(`mpesa_${CheckoutRequestID}`, {
        CheckoutRequestID,
        ResultCode,
        mpesaRef,
      });
      queued = true;
    } catch {
      // Redis unavailable — process directly
    }

    if (!queued) {
      await MpesaService.processCallback(CheckoutRequestID, ResultCode, mpesaRef);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed' });
  } catch (err: any) {
    console.error('[M-Pesa Callback Error]', err.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' });
  }
});

// ── User: Poll payment status ─────────────────────────────────────────────────
router.get('/status/:checkoutId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { checkoutId } = req.params;
    const userId = req.user!.id;

    const subscription = await prisma.subscription.findFirst({
      where: { checkoutId, userId },
      select: { status: true, expiresAt: true, days: true, amount: true, mpesaRef: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // If still pending, also query Safaricom for live status
    if (subscription.status === 'PENDING') {
      try {
        const live = await MpesaService.queryStatus(checkoutId);
        return res.json({ ...subscription, liveStatus: live });
      } catch {
        // M-Pesa query failed — return DB status
      }
    }

    res.json(subscription);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── User: Payment history ─────────────────────────────────────────────────────
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, planName: true, amount: true, days: true,
        status: true, checkoutId: true, mpesaRef: true,
        expiresAt: true, createdAt: true,
      },
    });
    res.json({ subscriptions: subs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── User: Active subscription status ─────────────────────────────────────────
router.get('/subscription-status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const active = await prisma.subscription.findFirst({
      where: {
        userId: req.user!.id,
        status: 'COMPLETED',
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
      select: { planName: true, days: true, expiresAt: true, mpesaRef: true },
    });
    res.json({ active: !!active, subscription: active });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: List all subscriptions ─────────────────────────────────────────────
router.get(
  '/admin/all',
  authenticateToken,
  requireRole('ADMIN'),
  async (_req, res) => {
    try {
      const subs = await prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, id: true } },
        },
      });
      res.json({ subscriptions: subs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── Admin: Manual activate subscription ──────────────────────────────────────
router.post(
  '/admin/activate',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { subscriptionId, days } = req.body;
      if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

      const result = await MpesaService.manualActivate(
        subscriptionId,
        req.user!.id,
        days ? Number(days) : undefined
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── Admin: Create subscription manually (cash/manual payment) ─────────────────
router.post(
  '/admin/create',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { userId, days, amount, phoneNumber, ref } = req.body;
      if (!userId || !days || !amount) {
        return res.status(400).json({ error: 'userId, days, and amount are required' });
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(days));

      const uniqueRef = ref || `MANUAL_${Date.now()}`;

      const sub = await prisma.subscription.create({
        data: {
          userId,
          amount: Number(amount),
          days: Number(days),
          phoneNumber: phoneNumber || 'N/A',
          checkoutId: uniqueRef,
          planName: `VIP_${days}D_MANUAL`,
          status: 'COMPLETED',
          mpesaRef: uniqueRef,
          expiresAt: expiry,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: `MANUAL_SUB_CREATED_BY:${req.user!.id}:${days}d:KES${amount}`,
        },
      });

      res.json({ subscription: sub, expiresAt: expiry });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export const PaymentsController = router;
