import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import * as authApi from '@/api/auth.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(
      z.string().refine(
        (v) => v.length === 0 || v.length === 10,
        'Phone number must be exactly 10 digits',
      ),
    ),
});

/**
 * Update profile form (name, phone).
 * Pre-populated from AuthContext user. Updates user state on success.
 */
function UpdateProfileForm() {
  const { user, setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone?.toString() ?? '',
    },
  });

  // Reset form when user changes (e.g. after refetch)
  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? '',
        phone: user.phone?.toString() ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const fields = { name: data.name };
      if (data.phone) fields.phone = Number(data.phone);

      const res = await authApi.updateMe(fields);
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="flex items-center gap-2">
          <User className="size-4 text-primary" aria-hidden="true" />
          <h3 className="settings-card-title">Profile</h3>
        </div>
        <p className="settings-card-desc">
          Update your name and contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <div className="form-field">
            <label htmlFor="profile-name" className="form-label">
              Full name
            </label>
            <Input
              id="profile-name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="form-error" role="alert">{errors.name.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="profile-email" className="form-label">
              Email address
            </label>
            <Input
              id="profile-email"
              type="email"
              value={user?.email ?? ''}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="profile-phone" className="form-label">
              Phone number
            </label>
            <Input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              placeholder="10-digit number"
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="form-error" role="alert">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { UpdateProfileForm };
