import { Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { ApiError } from '../../api/client';
import { Seo } from '../../components/seo/Seo';
import { Button } from '../../components/ui/button';
import { useAdminAuth } from '../AdminAuthContext';

export default function AdminLogin() {
  const { status, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authed') return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-btn border border-border bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-surface';

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <Seo title="Admin sign in" noindex />
      <div className="w-full max-w-sm rounded-sheet border border-border bg-surface p-8 shadow-lift">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-card bg-primary/10 text-primary-strong">
            <Lock className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">KU Food Hunt Admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage restaurants & reviews.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
