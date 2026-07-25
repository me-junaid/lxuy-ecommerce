import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const existingUser = await this.findByEmail(userData.email || '');
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findByEmail(
    email: string,
    selectFields?: string,
  ): Promise<UserDocument | null> {
    let query = this.userModel.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });
    if (selectFields) {
      query = query.select(selectFields);
    }
    return query.exec();
  }

  /**
   * Returns the user only if they exist AND are active.
   * This prevents deleted / banned accounts from accessing protected routes.
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isActive: true }).exec();
  }

  /**
   * Single-query variant used by the refresh token flow.
   * Fetches the user by ID together with BOTH hashed refresh tokens
   * (current + previous) in one round-trip.
   */
  async findByIdWithRefreshHash(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, isActive: true })
      .select('+refreshTokenHash +prevRefreshTokenHash')
      .exec();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    prevHash?: string | null,
    updateLastLogin: boolean = false,
  ): Promise<void> {
    let refreshTokenHash: string | null = null;
    if (refreshToken) {
      const salt = await bcrypt.genSalt(12);
      refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    }

    const update: Record<string, any> = { refreshTokenHash };
    // When rotating, carry the old hash forward into prevRefreshTokenHash
    // so the grace-window check in AuthService can accept the old token
    // during near-simultaneous page loads.
    if (prevHash !== undefined) {
      update['prevRefreshTokenHash'] = prevHash ?? null;
    }

    if (updateLastLogin) {
      update['lastLoginAt'] = new Date();
    }

    await this.userModel
      .findByIdAndUpdate(userId, update)
      .exec();
  }
}
