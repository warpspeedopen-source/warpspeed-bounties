import { z } from 'zod';

export const CategoryEnum = z.enum(['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'ARCHIVE']);
export const PriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const threadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  isRead: z.coerce.boolean().optional(),
  isStarred: z.coerce.boolean().optional(),
  search: z.string().optional(),
  label: z.string().optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'subject']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const threadParamsSchema = z.object({
  id: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type ThreadListQuery = z.infer<typeof threadListQuerySchema>;
export type Category = z.infer<typeof CategoryEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
