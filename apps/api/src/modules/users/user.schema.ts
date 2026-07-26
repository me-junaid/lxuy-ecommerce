import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  CUSTOMER = 'customer',
  STORE_MANAGER = 'store_manager',
  ADMIN = 'admin',
}

@Schema({ _id: false })
export class UserSession {
  @Prop({ required: true })
  tokenId!: string;

  @Prop({ required: true })
  refreshTokenHash!: string;

  @Prop({ type: String, default: null })
  prevRefreshTokenHash?: string | null;

  @Prop({ type: Date, default: null })
  prevTokenExpiresAt?: Date | null;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: Date, required: true, default: Date.now })
  lastActive!: Date;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: Record<string, unknown>) => {
      delete ret['password'];
      delete ret['passwordChangedAt'];
      delete ret['emailVerificationToken'];
      delete ret['passwordResetToken'];
      delete ret['sessions'];
      ret['id'] = (ret['_id'] as { toString?: () => string })?.toString?.();
      delete ret['_id'];
      delete ret['__v'];
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  firstName!: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  lastName!: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    index: true,
  })
  phoneNumber?: string;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  /** Whether the user has verified their email address. */
  @Prop({ default: false, index: true })
  isEmailVerified!: boolean;

  /**
   * SHA-256 hash of the raw email verification token.
   * The plain token is only ever sent in the email link — never stored.
   */
  @Prop({ type: String, select: false, default: null })
  emailVerificationToken?: string | null;

  /** Timestamp after which the verification token is no longer valid (24 h). */
  @Prop({ type: Date, default: null })
  emailVerificationExpires?: Date | null;

  /** SHA-256 hash of the password reset token. */
  @Prop({ type: String, select: false, default: null })
  passwordResetToken?: string | null;

  /** Timestamp after which the password reset token expires (1 h). */
  @Prop({ type: Date, default: null })
  passwordResetExpires?: Date | null;

  /** Active sessions for concurrent multi-device logins. */
  @Prop({ type: [UserSessionSchema], default: [], select: false })
  sessions?: UserSession[];

  /**
   * Updated on every successful login. Used for auditing.
   */
  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;

  /**
   * Set whenever the user changes their password.
   * The JwtStrategy uses this to reject tokens that were issued BEFORE
   * a password change (i.e. tokens that belong to the old password session).
   */
  @Prop({ type: Date, select: false, default: null })
  passwordChangedAt?: Date | null;

  @Prop({ required: false, unique: true, sparse: true, index: true })
  googleId?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Compound index — efficient lookups filtering by both email and active status.
UserSchema.index({ email: 1, isActive: 1 });

// Hash password before saving (only when it has been modified).
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Record when the password was last changed so old tokens can be invalidated.
  this.passwordChangedAt = new Date();
});
