import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

import volunteersImg from '@/assets/pexels-volunteers-team-6647026.jpg';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Login page — split-screen layout.
 * Supports redirect-after-login: if the user was redirected here by
 * ProtectedRoute, they'll be sent back to their original destination.
 */
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // "Incorrect email or password" → show as form-level error, not a toast
      if (err.code === 'UNAUTHORIZED') {
        setError('root', { message: 'Incorrect email or password' });
      } else {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      image={volunteersImg}
      imageAlt="Volunteers with cleaning equipment smiling outdoors"
    >
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Log in to your Utthan account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <div className="form-field">
            <label htmlFor="login-email" className="form-label">
              Email address
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="form-error" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div className="form-field">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="form-error" role="alert">{errors.root.message}</p>
          )}

          <div className="form-footer">
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Log in
            </Button>
            <p className="form-footer-links">
              Don&apos;t have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
