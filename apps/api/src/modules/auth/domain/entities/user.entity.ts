export interface UserEntity {
  id: number;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  displayName: string;
  targetJlpt: string;
  totalExp: number;
  currentStreakDays: number;
  isActive: boolean;
}
