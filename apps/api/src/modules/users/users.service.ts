import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserSession } from './user.schema';
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
    if (userData.phoneNumber) {
      const existingPhone = await this.userModel.findOne({
        phoneNumber: userData.phoneNumber,
        isActive: true,
      }).exec();
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
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
    return this.userModel.findOne({ _id: id, isActive: true }).select('+sessions').exec();
  }

  /**
   * Fetches user with the sessions array.
   */
  async findByIdWithSessions(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, isActive: true })
      .select('+sessions')
      .exec();
  }

  /**
   * Appends a session to the user's active sessions list.
   * Evicts the oldest session if total active sessions exceed 5.
   */
  async addSession(
    userId: string,
    session: UserSession,
  ): Promise<void> {
    const user = await this.findByIdWithSessions(userId);
    if (!user) return;

    if (!user.sessions) {
      user.sessions = [];
    }

    user.sessions.push(session);

    // Limit to max 5 sessions. Evict oldest by lastActive if exceeded.
    if (user.sessions.length > 5) {
      user.sessions.sort((a, b) => a.lastActive.getTime() - b.lastActive.getTime());
      user.sessions.shift(); // Evict oldest
    }

    user.lastLoginAt = new Date();
    await user.save();
  }

  /**
   * Updates an existing session by its tokenId.
   */
  async updateSession(
    userId: string,
    tokenId: string,
    update: Partial<UserSession>,
  ): Promise<void> {
    const user = await this.findByIdWithSessions(userId);
    if (!user) return;

    const sessionIndex = user.sessions?.findIndex(s => s.tokenId === tokenId);
    if (sessionIndex !== undefined && sessionIndex !== -1 && user.sessions) {
      const currentSession = user.sessions[sessionIndex];
      Object.assign(currentSession, update, { lastActive: new Date() });
      await user.save();
    }
  }

  /**
   * Removes a session by its tokenId (Logout current device).
   */
  async removeSession(userId: string, tokenId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        { $pull: { sessions: { tokenId } } },
      )
      .exec();
  }

  /**
   * Clears all sessions (Logout all devices).
   */
  async clearAllSessions(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        { $set: { sessions: [] } },
      )
      .exec();
  }

  /**
   * Persists the SHA-256-hashed verification token and its expiry.
   * Called immediately after user creation and on every resend.
   */
  async setEmailVerificationToken(
    userId: string,
    hashedToken: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: expires,
      })
      .exec();
  }

  /**
   * Looks up the user whose hashed token matches AND whose token hasn't expired.
   * Returns null when no match is found (invalid or expired token).
   */
  async findByEmailVerificationToken(
    hashedToken: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
        isActive: true,
      })
      .select('+emailVerificationToken')
      .exec();
  }

  /**
   * Marks the user's email as verified and clears the token fields.
   * Safe to call multiple times (idempotent).
   */
  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .exec();
  }

  /**
   * Sets the password reset token hash and expiry for the user.
   */
  async setPasswordResetToken(
    userId: string,
    hashedToken: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      })
      .exec();
  }

  /**
   * Finds the active user with matching non-expired password reset token hash.
   */
  async findByPasswordResetToken(
    hashedToken: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      })
      .select('+passwordResetToken +password')
      .exec();
  }

  /**
   * Clears the password reset token fields from the user.
   */
  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .exec();
  }
}
