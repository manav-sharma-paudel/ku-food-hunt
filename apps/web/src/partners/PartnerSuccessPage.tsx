import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { Seo } from '../components/seo/Seo';
import { Button } from '../components/ui/button';

interface SuccessState {
  name?: string;
  isResubmission?: boolean;
}

export default function PartnerSuccessPage() {
  const state = (useLocation().state ?? {}) as SuccessState;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <Seo title="Submission received" noindex />
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-basil/10 text-basil">
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {state.isResubmission ? 'Thanks — updates received!' : 'Thanks for applying!'}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        {state.name ? <strong className="text-foreground">{state.name}</strong> : 'Your restaurant'}{' '}
        is now waiting for review. Our team checks every submission by hand — we’ll email you at the
        contact address you gave us once it’s approved, usually within a few days.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to KU Food Hunt</Link>
      </Button>
    </div>
  );
}
