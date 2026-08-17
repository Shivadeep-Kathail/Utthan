import { UserPlus } from 'lucide-react';

/**
 * Signup page — placeholder for Phase 2 (Authentication).
 */
function SignupPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-8">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <UserPlus className="size-7 text-primary" aria-hidden="true" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Registration will be available in Phase 2.
        </p>
      </div>
    </section>
  );
}

export default SignupPage;
