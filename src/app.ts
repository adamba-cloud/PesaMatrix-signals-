import express from 'express';
import cors from 'cors';
import { AuthController } from './modules/auth/auth.controller';
import { AdminController } from './modules/admin/admin.controller';
import { PaymentsController } from './modules/billing/payments.controller';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', AuthController);
app.use('/api/v1/admin', AdminController);
app.use('/api/v1/payments', PaymentsController);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

export default app;
