export enum SportType {
  SOCCER = 'SOCCER',
  FOOTBALL = 'FOOTBALL',
  HOCKEY = 'HOCKEY',
  RUGBY = 'RUGBY',
  BASKETBALL = 'BASKETBALL',
  GENERIC = 'GENERIC',
}

export enum EventStatus {
  LIVE = 'LIVE',
  RECORDED = 'RECORDED',
  ARCHIVED = 'ARCHIVED',
}

export interface Team {
  id: string
  name: string
  shortName: string
  colour: string
}

export interface Event {
  id: string
  name: string
  sportType: SportType
  status: EventStatus
  date: string
  homeTeam: Team | null
  visitTeam: Team | null
  feeds: Feed[]
  tagCount: number
  createdAt: string
  updatedAt: string
}

export interface Feed {
  id: string
  eventId: string
  sourceName: string
  label: string
  hlsUrl: string | null
  mp4Url: string | null
  isActive: boolean
  quality: 'HQ' | 'LQ'
}
