import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

import * as authApi from '@/api/auth.api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import communityImg from '@/assets/community-helping-hands-stockcake.jpg';

const forgotSchema = z.object({
  email: z.email('Please enter a valid email address'),
});

/**
 * Forgot password page.
 *
 * Privacy rule: the generic success message covers BOTH the "email found"
 * and "email not found" outcomes (already unified by the backend).
 * But genuine network/server failures should show a real error — never
 * mask an actual failure with a false success.
 */
function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data);
      // Backend returns the same 200 + generic message for both
      // found and not-found emails — show success unconditionally.
      setSubmitted(true);
    } catch (err) {
      // Only genuine failures reach here (network, server errors).
      // Show the real error — don't mask it as success.
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      image={communityImg}
      imageAlt="Community members helping each other"
    >
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="text-sm text-foreground font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists with that email, we&apos;ve sent a password
            reset link. It may take a minute to arrive.
          </p>
          <Link
            to="/login"
            className="mt-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <div className="form-field">
              <label htmlFor="forgot-email" className="form-label">
                Email address
              </label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="form-error" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="form-footer">
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Send reset link
              </Button>
              <p className="form-footer-links">
                Remember your password?{' '}
                <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
