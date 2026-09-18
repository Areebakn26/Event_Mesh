import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import notifyRoutes from './routes/notify.routes';
import templateRoutes from './routes/template.routes';
import providerRoutes from './routes/provider.routes';
import dlqRoutes from './routes/dlq.routes';
import analyticsRoutes from './routes/analytics.routes';
import sseRoutes from './routes/sse.routes';
import subscriberRoutes from './routes/subscriber.routes';
import workflowRoutes from './routes/workflow.routes';
import inAppRoutes from './routes/inapp.routes';

// Initialize workers
import './workers/notification.worker';
import './workers/workflow.worker';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api', templateRoutes);
app.use('/api', providerRoutes);
app.use('/api', dlqRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', sseRoutes);
app.use('/', sseRoutes);
app.use('/v1/notify', notifyRoutes);
app.use('/api/v1/notify', notifyRoutes);
app.use('/v1', subscriberRoutes);
app.use('/api/v1', subscriberRoutes);
app.use('/v1', workflowRoutes);
app.use('/api/v1', workflowRoutes);
app.use('/v1', inAppRoutes);
app.use('/api/v1', inAppRoutes);
app.use('/v1', providerRoutes);
app.use('/api/v1', providerRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'EventMesh API is running' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`EventMesh server running on port ${PORT}`);
});
