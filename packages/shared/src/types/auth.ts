export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface UserTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}
