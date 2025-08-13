import { z } from 'zod'

// Message validation schemas
export const messageSchema = z.object({
  text: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .trim(),
  sessionId: z.string()
    .min(1, 'Session ID is required')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid session ID format'),
})

export const sessionIdSchema = z.string()
  .min(1, 'Session ID is required')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid session ID format')

// Form validation schemas
export const suggestionFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title too long (max 100 characters)')
    .trim(),
  detail: z.string()
    .min(10, 'Detail must be at least 10 characters')
    .max(1000, 'Detail too long (max 1000 characters)')
    .trim(),
})

export const reportFormSchema = z.object({
  link: z.string()
    .min(1, 'Link is required')
    .url('Invalid URL format')
    .max(500, 'URL too long'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long (max 500 characters)')
    .trim(),
})

export const deleteRequestFormSchema = z.object({
  link: z.string()
    .min(1, 'Link is required')
    .url('Invalid URL format')
    .max(500, 'URL too long'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long (max 500 characters)')
    .trim(),
  accountState: z.enum(['active', 'deactivated'], {
    errorMap: () => ({ message: 'Account state must be active or deactivated' })
  }),
})

export const bugReportFormSchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long (max 1000 characters)')
    .trim(),
  screenshotUrl: z.string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
})

// Support ticket schema
export const supportTicketSchema = z.object({
  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason too long (max 500 characters)')
    .trim(),
  contact: z.string()
    .min(1, 'Contact information is required')
    .max(200, 'Contact info too long (max 200 characters)')
    .trim(),
  meta: z.record(z.unknown()).optional(),
})

// FAQ search schema
export const faqSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long (max 200 characters)')
    .trim(),
})

// Order status schema
export const orderStatusSchema = z.object({
  orderId: z.string()
    .min(1, 'Order ID is required')
    .max(50, 'Order ID too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid order ID format'),
})

// Chat intent validation
export const chatIntentSchema = z.enum([
  'suggestion',
  'report_member',
  'usage_inquiry',
  'delete_request',
  'bug_report',
  'community_guidelines'
], {
  errorMap: () => ({ message: 'Invalid chat intent' })
})

// Server action payload schemas
export const chatActionPayloadSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    createdAt: z.number().optional(),
  })),
  sessionId: z.string().optional(),
})

export const saveMessagePayloadSchema = z.object({
  sessionId: sessionIdSchema,
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(2000),
  createdAt: z.number(),
})

// Chat session schema with user_id
export const chatSessionInsertSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  last_seen_assistant_count: z.number().nullable().optional(),
})

// Chat message insert schema
export const chatMessageInsertSchema = z.object({
  id: z.string().optional(),
  session_id: z.string(),
  role: z.enum(['user', 'assistant']).nullable().optional(),
  content_json: z.unknown().nullable().optional(),
  parts_json: z.unknown().nullable().optional(),
  created_at: z.string().optional(),
  read_at: z.string().nullable().optional(),
})

// Validation utility functions
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }
  return result.data
}

export function validateMessage(data: unknown) {
  return validateOrThrow(messageSchema, data)
}

export function validateSuggestionForm(data: unknown) {
  return validateOrThrow(suggestionFormSchema, data)
}

export function validateReportForm(data: unknown) {
  return validateOrThrow(reportFormSchema, data)
}

export function validateDeleteRequestForm(data: unknown) {
  return validateOrThrow(deleteRequestFormSchema, data)
}

export function validateBugReportForm(data: unknown) {
  return validateOrThrow(bugReportFormSchema, data)
}

export function validateSupportTicket(data: unknown) {
  return validateOrThrow(supportTicketSchema, data)
}

export function validateFaqSearch(data: unknown) {
  return validateOrThrow(faqSearchSchema, data)
}

export function validateOrderStatus(data: unknown) {
  return validateOrThrow(orderStatusSchema, data)
}

// Type exports for use in components
export type MessageInput = z.infer<typeof messageSchema>
export type SuggestionFormInput = z.infer<typeof suggestionFormSchema>
export type ReportFormInput = z.infer<typeof reportFormSchema>
export type DeleteRequestFormInput = z.infer<typeof deleteRequestFormSchema>
export type BugReportFormInput = z.infer<typeof bugReportFormSchema>
export type SupportTicketInput = z.infer<typeof supportTicketSchema>
export type FaqSearchInput = z.infer<typeof faqSearchSchema>
export type OrderStatusInput = z.infer<typeof orderStatusSchema>
export type ChatIntent = z.infer<typeof chatIntentSchema>