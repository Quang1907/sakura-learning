import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  displayName: z.string().min(1, 'Tên hiển thị không được để trống').max(100),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export interface AuthUserDto {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  displayName: string;
  targetJlpt?: string;
  totalExp?: number;
  currentStreakDays?: number;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken?: string;
}
