import bcrypt from 'bcryptjs';
import { UserTokenPayload } from '@sakura/shared';
import { jwtHelper } from '../modules/auth/jwt.helper.js';

export interface SeedUser {
  id: number;
  email: string;
  passwordPlain: string;
  passwordHash: string;
  role: 'ADMIN' | 'USER';
  displayName: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    id: 1,
    email: 'admin@sakura.app',
    passwordPlain: 'Admin@Sakura2026!',
    passwordHash: bcrypt.hashSync('Admin@Sakura2026!', 10),
    role: 'ADMIN',
    displayName: 'Sakura Quản Trị Viên',
  },
  {
    id: 2,
    email: 'user@sakura.app',
    passwordPlain: 'User@Sakura2026!',
    passwordHash: bcrypt.hashSync('User@Sakura2026!', 10),
    role: 'USER',
    displayName: 'Linh Học Viên Sakura',
  },
];

export function getTestAuthTokens() {
  const adminPayload: UserTokenPayload = {
    userId: SEED_USERS[0].id,
    email: SEED_USERS[0].email,
    role: SEED_USERS[0].role,
  };

  const userPayload: UserTokenPayload = {
    userId: SEED_USERS[1].id,
    email: SEED_USERS[1].email,
    role: SEED_USERS[1].role,
  };

  return {
    adminToken: jwtHelper.generateAccessToken(adminPayload),
    userToken: jwtHelper.generateAccessToken(userPayload),
    adminPayload,
    userPayload,
  };
}
