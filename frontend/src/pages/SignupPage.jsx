import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

import communityImg from '@/assets/pexels-community-helping-6646917.jpg';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords do not match',
  });

/**
 * Signup page — split-screen layout with form validation.
 * No role field (backend assigns 'user' by default).
 */
function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', passwordConfirm: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await signup(data);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Map duplicate email error to the email field
      if (
        err.message?.toLowerCase().includes('duplicate') &&
        err.message?.toLowerCase().includes('value')
      ) {
        setError('email', { message: 'This email is already in use' });
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
    <AuthLayout
      image={communityImg}
      imageAlt="Community members joining hands in support"
    >
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Utthan and start making an impact today.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <div className="form-field">
            <label htmlFor="signup-name" className="form-label">
              Full name
            </label>
            <Input
              id="signup-name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="form-error" role="alert">{errors.name.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="signup-email" className="form-label">
              Email address
            </label>
            <Input
              id="signup-email"
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
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <PasswordInput
              id="signup-password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="signup-password-confirm" className="form-label">
              Confirm password
            </label>
            <PasswordInput
              id="signup-password-confirm"
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

          <div className="form-footer">
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create account
            </Button>
            <p className="form-footer-links">
              Already have an account?{' '}
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
