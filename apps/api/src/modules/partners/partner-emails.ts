import { env } from '../../config/env';
import { sendMail } from '../../lib/mailer';

/** Where the partner form lives publicly — the subdomain in prod, SITE_URL in dev. */
const partnersBase = () => (env.PARTNERS_URL ?? env.SITE_URL).replace(/\/$/, '');
const editUrl = (token: string) => `${partnersBase()}/partners?token=${token}`;

/**
 * Owner-facing notifications for the approval workflow. Plain text on purpose:
 * it renders everywhere, never trips spam filters on styling, and matches the
 * short, factual tone these updates need. All senders are fire-and-forget —
 * `sendMail` logs failures and never throws.
 */
export function sendSubmissionReceived(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
  token: string;
}): void {
  void sendMail({
    to: opts.to,
    subject: `We received your submission — ${opts.restaurantName}`,
    text: [
      `Hi ${opts.ownerName},`,
      '',
      `Thanks for listing ${opts.restaurantName} on KU Food Hunt! Our team reviews every`,
      'submission by hand, usually within a few days. We will email you as soon as it is',
      'approved.',
      '',
      'Spotted a mistake? You can edit your submission any time before we review it:',
      editUrl(opts.token),
      '',
      '— The KU Food Hunt team',
    ].join('\n'),
  });
}

export function sendSubmissionApproved(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
  slug: string;
}): void {
  void sendMail({
    to: opts.to,
    subject: `You're live! ${opts.restaurantName} is now on KU Food Hunt`,
    text: [
      `Hi ${opts.ownerName},`,
      '',
      `Great news — ${opts.restaurantName} has been approved and is now visible to every`,
      'student browsing KU Food Hunt:',
      `${env.SITE_URL.replace(/\/$/, '')}/restaurants/${opts.slug}`,
      '',
      'Keep your menu, hours, and photos fresh — listings with good photos get',
      'noticeably more taps.',
      '',
      '— The KU Food Hunt team',
    ].join('\n'),
  });
}

export function sendSubmissionRejected(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
  reason: string;
  token: string;
}): void {
  void sendMail({
    to: opts.to,
    subject: `Your submission needs changes — ${opts.restaurantName}`,
    text: [
      `Hi ${opts.ownerName},`,
      '',
      `We looked at your submission for ${opts.restaurantName}, and it is not quite ready`,
      'to publish yet. Here is what our team said:',
      '',
      `  ${opts.reason}`,
      '',
      'You can fix this and resubmit with the link below — it reopens your submission',
      'with everything you already entered:',
      editUrl(opts.token),
      '',
      '— The KU Food Hunt team',
    ].join('\n'),
  });
}
