export enum UserRole {
  SUPERUSER = 'SUPERUSER',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  USER = 'USER',
  TEAM_ADMIN = 'TEAM_ADMIN',
  MEDICAL = 'MEDICAL',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  colour: string
  teamId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthTokenPayload {
  userId: string
  email: string
  role: UserRole
  teamId: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
