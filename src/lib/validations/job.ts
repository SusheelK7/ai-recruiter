import { z } from 'zod';

export const experienceLevels = ['entry', 'mid', 'senior', 'lead'] as const;

export const createJobSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().min(20, 'Description must be at least 20 characters'),
    requiredSkills: z
      .array(z.string().trim().min(1))
      .min(1, 'At least one skill is required'),
    experienceLevel: z.enum(experienceLevels),
    expiryDays: z.union([z.literal(7), z.literal(15), z.literal(30)]).optional(),
    customExpiryDate: z.string().optional(),
  })
  .refine(
    (data) => data.expiryDays || (data.customExpiryDate && data.customExpiryDate.length > 0),
    { message: 'Select an expiry period or provide a custom date', path: ['expiryDays'] }
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const generateJobSchema = z.object({
  title: z.string().trim().min(3).max(200),
  experienceLevel: z.enum(experienceLevels).optional(),
  keywords: z.string().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200).optional(),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').optional(),
  requiredSkills: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one skill is required')
    .optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  expiryDays: z.union([z.literal(7), z.literal(15), z.literal(30)]).optional().nullable(),
  customExpiryDate: z.string().optional().nullable(),
  status: z.enum(['active', 'closed', 'expired']).optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

