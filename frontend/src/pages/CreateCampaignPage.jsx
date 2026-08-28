import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  PenLine,
  Plus,
  Trash2,
  DollarSign,
  Users,
  Package,
} from 'lucide-react';

import { createCampaign } from '@/api/campaigns.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { LocationPicker } from '@/components/campaigns/LocationPicker';
import { ImageUpload } from '@/components/campaigns/ImageUpload';

// ── Enums (verified from backend Campaign model) ─────────────────

const CATEGORIES = [
  { value: 'medical', label: 'Medical' },
  { value: 'education', label: 'Education' },
  { value: 'social', label: 'Social' },
  { value: 'animal-welfare', label: 'Animal Welfare' },
  { value: 'disaster-relief', label: 'Disaster Relief' },
  { value: 'women-empowerment', label: 'Women Empowerment' },
  { value: 'child-welfare', label: 'Child Welfare' },
  { value: 'environment', label: 'Environment' },
  { value: 'community-development', label: 'Community Development' },
  { value: 'other', label: 'Other' },
];

const TYPES = [
  { value: 'fundraising', label: 'Fundraising', icon: DollarSign },
  { value: 'participation', label: 'Participation', icon: Users },
  { value: 'goods-donation', label: 'Goods Donation', icon: Package },
];

// ── Zod schema (mirrors backend Mongoose validation) ─────────────

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  needed: z.coerce.number().int().min(1, 'Must need at least 1'),
});

const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z
    .array(z.number())
    .length(2, 'Location coordinates are required')
    .refine(
      ([lng, lat]) =>
        lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
      'Invalid coordinates',
    ),
  address: z.string().min(1, 'Address is required'),
});

const campaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(10, 'Title must be at least 10 characters')
      .max(100, 'Title cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .min(50, 'Description must be at least 50 characters')
      .max(1000, 'Description cannot exceed 1000 characters'),
    category: z.enum(
      CATEGORIES.map((c) => c.value),
      { message: 'Please select a category' },
    ),
    type: z.enum(
      TYPES.map((t) => t.value),
      { message: 'Please select a campaign type' },
    ),
    amountNeeded: z.coerce.number().optional(),
    participantGoal: z.coerce.number().optional(),
    items: z.array(itemSchema).optional(),
    coverImage: z.string().min(1, 'Cover image is required'),
    location: locationSchema,
  })
  .refine(
    (data) => {
      if (data.type === 'fundraising') return (data.amountNeeded ?? 0) >= 1;
      return true;
    },
    { message: 'Amount needed must be at least 1', path: ['amountNeeded'] },
  )
  .refine(
    (data) => {
      if (data.type === 'participation')
        return (data.participantGoal ?? 0) >= 1;
      return true;
    },
    {
      message: 'Participant goal must be at least 1',
      path: ['participantGoal'],
    },
  )
  .refine(
    (data) => {
      if (data.type === 'goods-donation')
        return data.items && data.items.length >= 1;
      return true;
    },
    { message: 'At least one item is required', path: ['items'] },
  );

/**
 * CreateCampaignPage — full campaign creation form.
 *
 * Protected by ProtectedRoute (Phase 2).
 * On successful creation, shows "under review" message and redirects
 * to /campaigns/:slug so the creator can view their pending campaign.
 */
function CreateCampaignPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      type: 'fundraising',
      amountNeeded: '',
      participantGoal: '',
      items: [{ name: '', needed: '' }],
      coverImage: '',
      location: {
        type: 'Point',
        coordinates: [],
        address: '',
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedType = watch('type');

  const onSubmit = async (data) => {
    // Clean up type-conditional fields before sending
    const payload = { ...data };
    if (payload.type !== 'fundraising') delete payload.amountNeeded;
    if (payload.type !== 'participation') delete payload.participantGoal;
    if (payload.type !== 'goods-donation') delete payload.items;

    setIsSubmitting(true);
    try {
      const res = await createCampaign(payload);
      const slug = res.data.campaign.slug;

      toast.success(
        'Your campaign is under review and will be visible publicly once approved.',
        { duration: 6000 },
      );

      navigate(`/campaigns/${slug}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-campaign-page">
      {/* Header */}
      <div className="create-campaign-header">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <PenLine className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a Campaign
          </h1>
          <p className="text-sm text-muted-foreground">
            Start fundraising, rally participants, or collect goods.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="create-campaign-form"
      >
        {/* ── Basic Info ──────────────────────────────────── */}
        <fieldset className="create-campaign-section">
          <legend className="create-campaign-section-title">
            Basic Information
          </legend>

          <div className="form-field">
            <label htmlFor="campaign-title" className="form-label">
              Campaign Title
            </label>
            <Input
              id="campaign-title"
              placeholder="Give your campaign a compelling title (10-100 chars)"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && (
              <p className="form-error" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="campaign-description" className="form-label">
              Description
            </label>
            <textarea
              id="campaign-description"
              className="create-campaign-textarea"
              placeholder="Describe what your campaign is about and why it matters (50-1000 chars)"
              rows={5}
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            <div className="create-campaign-char-count">
              {watch('description')?.length || 0} / 1000
            </div>
            {errors.description && (
              <p className="form-error" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="create-campaign-row">
            {/* Category */}
            <div className="form-field">
              <label className="form-label">Category</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.category}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="form-error" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div className="form-field">
              <label className="form-label">Campaign Type</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.type}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <t.icon className="size-4 mr-1.5 inline" aria-hidden="true" />
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="form-error" role="alert">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* ── Type-Conditional Fields ─────────────────────── */}
        {selectedType === 'fundraising' && (
          <fieldset className="create-campaign-section create-campaign-conditional">
            <legend className="create-campaign-section-title">
              <DollarSign className="inline size-4 mr-1" aria-hidden="true" />
              Fundraising Goal
            </legend>
            <div className="form-field">
              <label htmlFor="campaign-amount" className="form-label">
                Amount Needed (₹)
              </label>
              <Input
                id="campaign-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter the target amount"
                aria-invalid={!!errors.amountNeeded}
                {...register('amountNeeded')}
              />
              {errors.amountNeeded && (
                <p className="form-error" role="alert">
                  {errors.amountNeeded.message}
                </p>
              )}
            </div>
          </fieldset>
        )}

        {selectedType === 'participation' && (
          <fieldset className="create-campaign-section create-campaign-conditional">
            <legend className="create-campaign-section-title">
              <Users className="inline size-4 mr-1" aria-hidden="true" />
              Participation Goal
            </legend>
            <div className="form-field">
              <label htmlFor="campaign-participants" className="form-label">
                Participant Goal
              </label>
              <Input
                id="campaign-participants"
                type="number"
                min="1"
                step="1"
                placeholder="How many participants do you need?"
                aria-invalid={!!errors.participantGoal}
                {...register('participantGoal')}
              />
              {errors.participantGoal && (
                <p className="form-error" role="alert">
                  {errors.participantGoal.message}
                </p>
              )}
            </div>
          </fieldset>
        )}

        {selectedType === 'goods-donation' && (
          <fieldset className="create-campaign-section create-campaign-conditional">
            <legend className="create-campaign-section-title">
              <Package className="inline size-4 mr-1" aria-hidden="true" />
              Items Needed
            </legend>

            <div className="create-campaign-items">
              {fields.map((field, index) => (
                <div key={field.id} className="create-campaign-item-row">
                  <div className="form-field" style={{ flex: 2 }}>
                    <label
                      htmlFor={`item-name-${index}`}
                      className="form-label"
                    >
                      Item Name
                    </label>
                    <Input
                      id={`item-name-${index}`}
                      placeholder="e.g. Blankets"
                      aria-invalid={!!errors.items?.[index]?.name}
                      {...register(`items.${index}.name`)}
                    />
                    {errors.items?.[index]?.name && (
                      <p className="form-error" role="alert">
                        {errors.items[index].name.message}
                      </p>
                    )}
                  </div>

                  <div className="form-field" style={{ flex: 1 }}>
                    <label
                      htmlFor={`item-needed-${index}`}
                      className="form-label"
                    >
                      Qty Needed
                    </label>
                    <Input
                      id={`item-needed-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      aria-invalid={!!errors.items?.[index]?.needed}
                      {...register(`items.${index}.needed`)}
                    />
                    {errors.items?.[index]?.needed && (
                      <p className="form-error" role="alert">
                        {errors.items[index].needed.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="create-campaign-item-remove"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', needed: '' })}
              >
                <Plus className="size-4 mr-1" aria-hidden="true" />
                Add Item
              </Button>
            </div>

            {errors.items?.root && (
              <p className="form-error" role="alert">
                {errors.items.root.message}
              </p>
            )}
            {typeof errors.items?.message === 'string' && (
              <p className="form-error" role="alert">
                {errors.items.message}
              </p>
            )}
          </fieldset>
        )}

        {/* ── Cover Image ─────────────────────────────────── */}
        <fieldset className="create-campaign-section">
          <legend className="create-campaign-section-title">Media</legend>
          <Controller
            name="coverImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                error={errors.coverImage?.message}
              />
            )}
          />
        </fieldset>

        {/* ── Location ────────────────────────────────────── */}
        <fieldset className="create-campaign-section">
          <legend className="create-campaign-section-title">Location</legend>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <LocationPicker
                value={field.value}
                onChange={field.onChange}
                error={
                  errors.location?.coordinates?.message ||
                  errors.location?.address?.message ||
                  errors.location?.message
                }
              />
            )}
          />
        </fieldset>

        {/* ── Submit ──────────────────────────────────────── */}
        <div className="create-campaign-footer">
          {errors.root && (
            <p className="form-error" role="alert">
              {errors.root.message}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="create-campaign-submit"
            loading={isSubmitting}
          >
            Create Campaign
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your campaign will be reviewed before going live.
          </p>
        </div>
      </form>
    </section>
  );
}

export default CreateCampaignPage;
