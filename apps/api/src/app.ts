import { APP_NAME } from '@ku-food-hunt/shared';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env';
import { logger } from './lib/logger';
import { UPLOADS_ROOT } from './lib/uploads';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { adminRouter } from './modules/admin/admin.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { homeRouter } from './modules/home/home.routes';
import { mapRouter } from './modules/map/map.routes';
import { partnersRouter } from './modules/partners/partners.routes';
import { restaurantsRouter } from './modules/restaurants/restaurants.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { searchRouter } from './modules/search/search.routes';
import { seoRouter } from './modules/seo/seo.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Must match the real number of proxies in front of this process — see the
  // TRUST_PROXY notes in config/env.ts. Defaults to 0 (direct exposure) so a
  // missing value fails closed: X-Forwarded-For is ignored rather than trusted.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      // 1-year HSTS with preload — only meaningful over HTTPS in production.
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      // The SPA is served from its own origin; a strict document CSP belongs at
      // that edge (see docs/LAUNCH.md). Helmet's default CSP still hardens any
      // HTML the API itself might emit.
    }),
  );
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/healthz' },
    }),
  );

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // SEO: /sitemap.xml (dynamic, from published restaurants).
  app.use(seoRouter);

  // User-uploaded photos. Content-hashed filenames are immutable, so they can be
  // cached hard. CORP is relaxed to cross-origin so the web app can embed them
  // when the API is served from a separate subdomain in production.
  app.use(
    '/uploads',
    express.static(UPLOADS_ROOT, {
      immutable: true,
      maxAge: '30d',
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

  app.use(
    '/api/v1',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );

  app.get('/api/v1', (_req, res) => {
    res.json({
      data: {
        name: APP_NAME,
        api: 'v1',
        endpoints: [
          '/api/v1/restaurants',
          '/api/v1/restaurants/:slug',
          '/api/v1/restaurants/:slug/reviews',
          '/api/v1/reviews/:id/helpful',
          '/api/v1/uploads/review-photo',
          '/api/v1/categories',
          '/api/v1/search/suggest',
          '/api/v1/home',
          '/api/v1/map/restaurants',
          '/api/v1/partners/submissions',
        ],
      },
    });
  });

  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/restaurants', restaurantsRouter);
  app.use('/api/v1/reviews', reviewsRouter);
  app.use('/api/v1/uploads', uploadsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/home', homeRouter);
  app.use('/api/v1/map', mapRouter);
  app.use('/api/v1/partners', partnersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
