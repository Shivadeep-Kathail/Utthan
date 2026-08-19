import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import * as authApi from '@/api/auth.api';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

const changePasswordSchema = z
  .object({
    passwordCurrent: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    passwordConfirm: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords do not match',
  });

/**
 * Change password form.
 * Calls updatePassword, which returns a new cookie + user.
 * Updates AuthContext user state on success (per user feedback).
 */
function ChangePasswordForm() {
  const { setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { passwordCurrent: '', password: '', passwordConfirm: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await authApi.updatePassword(data);
      // Update user from response (backend issues fresh cookie + returns user)
      setUser(res.data.user);
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      // "Incorrect password!" → map to current password field
      if (err.code === 'UNAUTHORIZED') {
        setError('passwordCurrent', { message: 'Current password is incorrect' });
      } else if (err.code === 'VALIDATION') {
        setError('root', { message: err.message });
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          <h3 className="settings-card-title">Change password</h3>
        </div>
        <p className="settings-card-desc">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <div className="form-field">
            <label htmlFor="pwd-current" className="form-label">
              Current password
            </label>
            <PasswordInput
              id="pwd-current"
              autoComplete="current-password"
              aria-invalid={!!errors.passwordCurrent}
              {...register('passwordCurrent')}
            />
            {errors.passwordCurrent && (
              <p className="form-error" role="alert">{errors.passwordCurrent.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="pwd-new" className="form-label">
              New password
            </label>
            <PasswordInput
              id="pwd-new"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="pwd-new-confirm" className="form-label">
              Confirm new password
            </label>
            <PasswordInput
              id="pwd-new-confirm"
              autoComplete="new-password"
              aria-invalid={!!errors.passwordConfirm}
              {...register('passwordConfirm')}
            />
            {errors.passwordConfirm && (
              <p className="form-error" role="alert">{errors.passwordConfirm.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="form-error" role="alert">{errors.root.message}</p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={isSubmitting}>
              Update password
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { ChangePasswordForm };
