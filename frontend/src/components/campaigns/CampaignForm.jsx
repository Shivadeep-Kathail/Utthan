import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DollarSign,
  Users,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';

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

const campaignSchema = z.preprocess(
  // Strip type-conditional fields BEFORE validation so that default
  // values for hidden fields (e.g. items: [{ name: '', needed: '' }])
  // don't cause silent validation failures.
  (val) => {
    const d = { ...val };
    if (d.type !== 'fundraising') d.amountNeeded = undefined;
    if (d.type !== 'participation') d.participantGoal = undefined;
    if (d.type !== 'goods-donation') d.items = undefined;
    return d;
  },
  z
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
    ),
);

/**
 * Recursively flatten react-hook-form's nested errors object into a
 * flat array of { path, message } for the error summary display.
 */
function flattenErrors(errors, prefix = '') {
  const result = [];
  for (const key of Object.keys(errors)) {
    if (key === 'ref') continue; // skip RHF internal ref
    const err = errors[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (err?.message) {
      result.push({ path, message: err.message });
    } else if (typeof err === 'object' && err !== null) {
      result.push(...flattenErrors(err, path));
    }
  }
  return result;
}

/**
 * Build default form values, optionally merging with existing campaign
 * data for edit mode.
 */
function buildDefaults(initialData) {
  const base = {
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
  };

  if (!initialData) return base;

  return {
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || '',
    type: initialData.type || 'fundraising',
    amountNeeded: initialData.amountNeeded ?? '',
    participantGoal: initialData.participantGoal ?? '',
    items:
      initialData.items && initialData.items.length > 0
        ? initialData.items.map((it) => ({ name: it.name, needed: it.needed }))
        : [{ name: '', needed: '' }],
    coverImage: initialData.coverImage || '',
    location: initialData.location
      ? {
          type: 'Point',
          coordinates: initialData.location.coordinates || [],
          address: initialData.location.address || '',
        }
      : base.location,
  };
}

/**
 * CampaignForm — shared form component for create and edit.
 *
 * Props:
 * - mode:        'create' | 'edit'
 * - initialData: campaign data for pre-filling (edit mode)
 * - onSubmit:    async (validatedData) => void
 * - isSubmitting: boolean
 */
function CampaignForm({ mode = 'create', initialData, onSubmit, isSubmitting }) {
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: buildDefaults(initialData),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedType = watch('type');

  const handleFormSubmit = async (data) => {
    // Clean up type-conditional fields before sending
    const payload = { ...data };
    if (payload.type !== 'fundraising') delete payload.amountNeeded;
    if (payload.type !== 'participation') delete payload.participantGoal;
    if (payload.type !== 'goods-donation') delete payload.items;

    // In edit mode, the backend only accepts: title, description, category,
    // coverImage, images, location. Strip type-related fields.
    if (isEdit) {
      delete payload.type;
      delete payload.amountNeeded;
      delete payload.participantGoal;
      delete payload.items;
    }

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
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

          {/* Type — disabled in edit mode since backend doesn't allow changing it */}
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
                  disabled={isEdit}
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
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Campaign type cannot be changed after creation.
              </p>
            )}
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
              disabled={isEdit}
              {...register('amountNeeded')}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Fundraising goal cannot be changed after creation.
              </p>
            )}
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
              disabled={isEdit}
              {...register('participantGoal')}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Participant goal cannot be changed after creation.
              </p>
            )}
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
                    disabled={isEdit}
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
                    disabled={isEdit}
                    {...register(`items.${index}.needed`)}
                  />
                  {errors.items?.[index]?.needed && (
                    <p className="form-error" role="alert">
                      {errors.items[index].needed.message}
                    </p>
                  )}
                </div>

                {!isEdit && (
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
                )}
              </div>
            ))}

            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', needed: '' })}
              >
                <Plus className="size-4 mr-1" aria-hidden="true" />
                Add Item
              </Button>
            )}
          </div>

          {isEdit && (
            <p className="text-xs text-muted-foreground mt-2">
              Item list cannot be changed after creation.
            </p>
          )}

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
        {/* Show a summary of all validation errors so the user always
            knows what's blocking submission — even for fields whose
            error display is inside a conditionally-rendered section. */}
        {Object.keys(errors).length > 0 && (
          <div className="form-error-summary" role="alert">
            <p className="form-error-summary-title">
              Please fix the following errors:
            </p>
            <ul className="form-error-summary-list">
              {flattenErrors(errors).map(({ path, message }) => (
                <li key={path}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          className="create-campaign-submit"
          loading={isSubmitting}
        >
          {isEdit ? 'Save Changes' : 'Create Campaign'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {isEdit
            ? 'Your changes will be saved immediately.'
            : 'Your campaign will be reviewed before going live.'}
        </p>
      </div>
    </form>
  );
}

export { CampaignForm };
