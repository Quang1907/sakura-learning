import bcrypt from 'bcryptjs';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  AuthUserDto,
  UserTokenPayload,
} from '@sakura/shared';
import { authRepository, AuthRepository } from './auth.repository.js';
import { jwtHelper, JwtHelper } from './jwt.helper.js';

export class AuthService {
  constructor(
    private readonly repo: AuthRepository = authRepository,
    private readonly jwt: JwtHelper = jwtHelper,
  ) {}

  public async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = bcrypt.compareSync(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    const payload: UserTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.generateAccessToken(payload);
    const refreshToken = this.jwt.generateRefreshToken(payload);

    const userDto: AuthUserDto = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      targetJlpt: user.targetJlpt,
      totalExp: user.totalExp,
      currentStreakDays: user.currentStreakDays,
    };

    return {
      user: userDto,
      accessToken,
      refreshToken,
    };
  }

  public async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(dto.password, salt);

    const createdUser = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: 'USER',
    });

    const payload: UserTokenPayload = {
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    };

    const accessToken = this.jwt.generateAccessToken(payload);
    const refreshToken = this.jwt.generateRefreshToken(payload);

    return {
      user: createdUser,
      accessToken,
      refreshToken,
    };
  }

  public async getProfile(userId: number): Promise<AuthUserDto> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      targetJlpt: user.targetJlpt,
      totalExp: user.totalExp,
      currentStreakDays: user.currentStreakDays,
    };
  }
}

export const authService = new AuthService();
