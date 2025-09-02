import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import oauthRoutes from './oauth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import config from '../config/env';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'node:path';
import axios from 'axios';


const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'OK' });
});

router.get('/version', (_req: Request, res: Response) => {
  res.json({ success: true, data: { apiVersion: config.server.apiVersion, env: config.server.nodeEnv } });
});

router.get('/test', (_req: Request, res: Response) => {
  axios.get('https://api.ipquery.io/?format=json').then(response => {
    res.json({ success: true, data: response.data });
  }).catch((error) => {
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  });
});

router.use('/auth', authRoutes);
router.use('/oauth', oauthRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

// Swagger docs
try {
  const apiSpecPath = path.resolve(process.cwd(), 'docs', 'api.yaml');
  const swaggerDocument = yaml.load(apiSpecPath);
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  // no-op if spec not found
}

export default router;
