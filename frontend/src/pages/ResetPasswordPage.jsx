import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import * as authApi from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

import foodBoxesImg from '@/assets/Volunteers-assemblying-food-boxes-12-22-24.webp';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords do not match',
  });

/**
 * Reset password page.
 * Reads the reset token from the URL, calls PATCH /users/resetPassword/:token.
 *
 * On success: backend returns cookie + user → auto-login.
 * We extract data.user only — never store the token field.
 */
function ResetPasswordPage() {
  const { token } = useParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setTokenError(null);
    try {
      const res = await authApi.resetPassword(token, data);
      // Auto-login: backend sets cookie + returns user
      setUser(res.data.user);
      toast.success('Password reset successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Invalid or expired token
      if (err.code === 'VALIDATION' || err.status === 400) {
        setTokenError(err.message);
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      image={foodBoxesImg}
      imageAlt="Volunteers assembling food boxes at a community drive"
    >
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      {tokenError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="mt-2 inline-block text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            Request a new reset link
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <div className="form-field">
            <label htmlFor="reset-password" className="form-label">
              New password
            </label>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="reset-password-confirm" className="form-label">
              Confirm new password
            </label>
            <PasswordInput
              id="reset-password-confirm"
              autoComplete="new-password"
              aria-invalid={!!errors.passwordConfirm}
              {...register('passwordConfirm')}
            />
            {errors.passwordConfirm && (
              <p className="form-error" role="alert">{errors.passwordConfirm.message}</p>
            )}
          </div>

          <div className="form-footer">
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Reset password
            </Button>
            <p className="form-footer-links">
              Remember your password?{' '}
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
