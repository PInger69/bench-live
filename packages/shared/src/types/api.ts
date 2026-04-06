export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// WebSocket event types
export enum WsEventType {
  TAG_CREATED = 'TAG_CREATED',
  TAG_UPDATED = 'TAG_UPDATED',
  TAG_DELETED = 'TAG_DELETED',
  EVENT_STARTED = 'EVENT_STARTED',
  EVENT_ENDED = 'EVENT_ENDED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
}

export interface WsMessage<T = unknown> {
  type: WsEventType
  payload: T
  eventId: string
  userId: string
  timestamp: string
}
