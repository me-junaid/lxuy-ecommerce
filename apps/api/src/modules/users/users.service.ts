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
    let query = this.userModel.findOne({ email: email.toLowerCase() });
    if (selectFields) {
      query = query.select(selectFields);
    }
    return query.exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    let refreshTokenHash: string | null = null;
    if (refreshToken) {
      const salt = await bcrypt.genSalt(12);
      refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    }

    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }
}
