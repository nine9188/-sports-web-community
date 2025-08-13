// Chatbot domain error handling utilities

export enum ChatbotErrorCode {
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  MESSAGE_SAVE_FAILED = 'MESSAGE_SAVE_FAILED',
  
  // AI/API errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_SESSION_ID = 'MISSING_SESSION_ID',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  
  // Tool calling errors
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  FAQ_SEARCH_FAILED = 'FAQ_SEARCH_FAILED',
  SUPPORT_TICKET_FAILED = 'SUPPORT_TICKET_FAILED',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ChatbotError extends Error {
  public readonly code: ChatbotErrorCode
  public readonly retryable: boolean
  public readonly context?: Record<string, unknown>
  public readonly timestamp: string

  constructor(
    message: string,
    code: ChatbotErrorCode,
    options: {
      retryable?: boolean
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'ChatbotError'
    this.code = code
    this.retryable = options.retryable ?? false
    this.context = options.context
    this.timestamp = new Date().toISOString()
    
    if (options.cause) {
      this.cause = options.cause
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

// Error factory functions for common scenarios
export const ChatbotErrors = {
  databaseConnection: (cause?: Error) => new ChatbotError(
    'Failed to connect to database',
    ChatbotErrorCode.DATABASE_CONNECTION_FAILED,
    { retryable: true, cause }
  ),

  sessionNotFound: (sessionId: string) => new ChatbotError(
    'Chat session not found',
    ChatbotErrorCode.SESSION_NOT_FOUND,
    { context: { sessionId } }
  ),

  messageSaveFailed: (sessionId: string, cause?: Error) => new ChatbotError(
    'Failed to save message to database',
    ChatbotErrorCode.MESSAGE_SAVE_FAILED,
    { retryable: true, context: { sessionId }, cause }
  ),

  aiServiceUnavailable: (cause?: Error) => new ChatbotError(
    'AI service is temporarily unavailable',
    ChatbotErrorCode.AI_SERVICE_UNAVAILABLE,
    { retryable: true, cause }
  ),

  aiRateLimitExceeded: () => new ChatbotError(
    'AI service rate limit exceeded',
    ChatbotErrorCode.AI_RATE_LIMIT_EXCEEDED,
    { retryable: true }
  ),

  invalidInput: (field: string, value?: unknown) => new ChatbotError(
    `Invalid input for field: ${field}`,
    ChatbotErrorCode.INVALID_INPUT,
    { context: { field, value } }
  ),

  messageTooLong: (length: number, maxLength: number) => new ChatbotError(
    `Message too long: ${length} characters (max: ${maxLength})`,
    ChatbotErrorCode.MESSAGE_TOO_LONG,
    { context: { length, maxLength } }
  ),

  toolExecutionFailed: (toolName: string, cause?: Error) => new ChatbotError(
    `Tool execution failed: ${toolName}`,
    ChatbotErrorCode.TOOL_EXECUTION_FAILED,
    { retryable: true, context: { toolName }, cause }
  ),
}

// Error handling utility
export async function handleChatbotError<T>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: ChatbotError) => void
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const chatbotError = error instanceof ChatbotError 
      ? error 
      : new ChatbotError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          ChatbotErrorCode.UNKNOWN_ERROR,
          { cause: error instanceof Error ? error : undefined }
        )

    // Log error (in production, this would go to a proper logging service)
    console.error('[ChatbotError]', chatbotError.toJSON())

    if (onError) {
      onError(chatbotError)
    }

    if (fallback !== undefined) {
      return fallback
    }

    throw chatbotError
  }
}

// Retry utility for retryable operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoffMultiplier = 2 } = options
  let currentDelay = delay

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const isLastAttempt = attempt > maxRetries
      const isRetryableError = error instanceof ChatbotError && error.retryable

      if (isLastAttempt || !isRetryableError) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffMultiplier
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new ChatbotError('Unexpected error in retry logic', ChatbotErrorCode.UNKNOWN_ERROR)
}