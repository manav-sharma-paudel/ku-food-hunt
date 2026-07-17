import { env } from '../config/env';
import { logger } from './logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Minimal transactional mailer, env-gated like Turnstile and analytics: with no
 * RESEND_API_KEY (local dev) the message is logged instead of sent, so every
 * flow works out of the box. Talks to Resend's plain HTTPS API — no SDK.
 *
 * Never throws: a broken mail provider must not fail the submission or the
 * admin's approve/reject action it accompanies.
 */
export async function sendMail(msg: MailMessage): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info({ email: msg }, 'RESEND_API_KEY not set — email logged instead of sent');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      logger.error(
        { status: res.status, body: await res.text(), to: msg.to, subject: msg.subject },
        'Resend rejected the email',
      );
    }
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject }, 'Email send failed');
  }
}
