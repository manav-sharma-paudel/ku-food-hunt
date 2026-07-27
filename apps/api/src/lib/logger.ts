import { pino } from 'pino';

import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  /**
   * pino-http's default request serializer logs the full header block, which
   * includes `Cookie` — and that carries the raw `kfh_admin_session` token. The
   * session cookie is httpOnly precisely so no client script can read it, so
   * printing it to stdout on every request would hand any log reader a live
   * admin session to replay. Same for the `Set-Cookie` on the login response,
   * which carries a freshly minted token.
   *
   * These paths are censored rather than removed so it stays visible that a
   * credential was present, which is what you want when reading an auth trace.
   */
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-csrf-token"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
