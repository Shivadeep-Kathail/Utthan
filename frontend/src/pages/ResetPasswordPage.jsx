import { useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/**
 * Reset password page — placeholder for Phase 2 (Authentication).
 * Receives the reset token from the URL.
 */
function ResetPasswordPage() {
  const { token } = useParams();

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="size-7 text-primary" aria-hidden="true" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Token: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{token?.slice(0, 12)}…</code>
        </p>
        <p className="text-sm text-muted-foreground">
          Password reset will be available in Phase 2.
        </p>
      </div>
    </section>
  );
}

export default ResetPasswordPage;
