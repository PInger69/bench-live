export enum TagType {
  NORMAL = 'NORMAL',
  DURATION_OPEN = 'DURATION_OPEN',
  DURATION_CLOSE = 'DURATION_CLOSE',
  TELESTRATION = 'TELESTRATION',
  GAME_START = 'GAME_START',
  GAME_END = 'GAME_END',
  // Hockey
  HOCKEY_LINE_ON = 'HOCKEY_LINE_ON',
  HOCKEY_LINE_OFF = 'HOCKEY_LINE_OFF',
  HOCKEY_PERIOD_START = 'HOCKEY_PERIOD_START',
  HOCKEY_PERIOD_END = 'HOCKEY_PERIOD_END',
  // Soccer
  SOCCER_HALF_START = 'SOCCER_HALF_START',
  SOCCER_HALF_END = 'SOCCER_HALF_END',
  SOCCER_ZONE_START = 'SOCCER_ZONE_START',
  SOCCER_ZONE_END = 'SOCCER_ZONE_END',
  // Football
  FOOTBALL_DOWN_START = 'FOOTBALL_DOWN_START',
  FOOTBALL_DOWN_END = 'FOOTBALL_DOWN_END',
  FOOTBALL_QUARTER_START = 'FOOTBALL_QUARTER_START',
  FOOTBALL_QUARTER_END = 'FOOTBALL_QUARTER_END',
}

export interface Tag {
  id: string
  eventId: string
  type: TagType
  name: string
  time: number          // video timestamp in seconds
  duration: number      // clip length in seconds
  startTime: number | null
  closeTime: number | null
  durationId: string | null  // links open/close duration tags
  colour: string
  comment: string | null
  rating: number | null      // 1-5
  coachPick: boolean
  period: string | null
  players: string[]
  extraData: Record<string, unknown>  // sport-specific
  telestration: unknown | null
  thumbnails: Record<string, string>  // sourceKey -> URL
  userId: string
  userRole: string
  synced: boolean
  deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTagRequest {
  eventId: string
  type: TagType
  name: string
  time: number
  duration?: number
  colour?: string
  comment?: string
  rating?: number
  coachPick?: boolean
  period?: string
  players?: string[]
  extraData?: Record<string, unknown>
}

export interface UpdateTagRequest {
  comment?: string
  rating?: number
  coachPick?: boolean
  players?: string[]
  period?: string
  extraData?: Record<string, unknown>
  deleted?: boolean
}
