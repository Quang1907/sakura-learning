import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabasePool } from '../../config/database.js';
import { AuthUserDto } from '@sakura/shared';
import { SEED_USERS } from '../../database/seed-users.js';

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

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  is_active: number;
  display_name?: string;
  target_jlpt?: string;
  total_exp?: number;
  current_streak_days?: number;
}

// In-memory store initialized from SEED_USERS
const IN_MEMORY_USERS: UserEntity[] = SEED_USERS.map((u) => ({
  id: u.id,
  email: u.email.toLowerCase(),
  passwordHash: u.passwordHash,
  role: u.role,
  displayName: u.displayName,
  targetJlpt: u.role === 'ADMIN' ? 'N1' : 'N5',
  totalExp: u.role === 'ADMIN' ? 1000 : 120,
  currentStreakDays: u.role === 'ADMIN' ? 15 : 3,
  isActive: true,
}));

let nextUserId = 100;

export class AuthRepository {
  public async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.trim().toLowerCase();

    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<UserRow[]>(
        `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
                p.display_name, p.target_jlpt, p.total_exp, p.current_streak_days
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.email = ? AND u.deleted_at IS NULL
         LIMIT 1`,
        [normalized],
      );

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          passwordHash: r.password_hash,
          role: r.role,
          displayName: r.display_name ?? 'Sakura Learner',
          targetJlpt: r.target_jlpt ?? 'N5',
          totalExp: Number(r.total_exp ?? 0),
          currentStreakDays: Number(r.current_streak_days ?? 0),
          isActive: Boolean(r.is_active),
        };
      }
      return null;
    } catch {
      // In-memory fallback
      const found = IN_MEMORY_USERS.find((u) => u.email === normalized && u.isActive);
      return found ? { ...found } : null;
    }
  }

  public async findById(id: number): Promise<UserEntity | null> {
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<UserRow[]>(
        `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
                p.display_name, p.target_jlpt, p.total_exp, p.current_streak_days
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.id = ? AND u.deleted_at IS NULL
         LIMIT 1`,
        [id],
      );

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          passwordHash: r.password_hash,
          role: r.role,
          displayName: r.display_name ?? 'Sakura Learner',
          targetJlpt: r.target_jlpt ?? 'N5',
          totalExp: Number(r.total_exp ?? 0),
          currentStreakDays: Number(r.current_streak_days ?? 0),
          isActive: Boolean(r.is_active),
        };
      }
      return null;
    } catch {
      const found = IN_MEMORY_USERS.find((u) => u.id === id && u.isActive);
      return found ? { ...found } : null;
    }
  }

  public async createUser(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    role?: 'USER' | 'ADMIN';
  }): Promise<AuthUserDto> {
    const normalized = data.email.trim().toLowerCase();
    const role = data.role ?? 'USER';

    try {
      const pool = getDatabasePool();
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [userResult] = await connection.query<ResultSetHeader>(
          'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
          [normalized, data.passwordHash, role],
        );
        const newId = userResult.insertId;

        await connection.query(
          'INSERT INTO user_profiles (user_id, display_name, target_jlpt) VALUES (?, ?, ?)',
          [newId, data.displayName, 'N5'],
        );

        await connection.commit();

        return {
          id: newId,
          email: normalized,
          role,
          displayName: data.displayName,
          targetJlpt: 'N5',
          totalExp: 0,
          currentStreakDays: 0,
        };
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch {
      // In-memory fallback
      const newId = ++nextUserId;
      const newUser: UserEntity = {
        id: newId,
        email: normalized,
        passwordHash: data.passwordHash,
        role,
        displayName: data.displayName,
        targetJlpt: 'N5',
        totalExp: 0,
        currentStreakDays: 0,
        isActive: true,
      };
      IN_MEMORY_USERS.push(newUser);

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
        targetJlpt: newUser.targetJlpt,
        totalExp: newUser.totalExp,
        currentStreakDays: newUser.currentStreakDays,
      };
    }
  }
}

export const authRepository = new AuthRepository();
