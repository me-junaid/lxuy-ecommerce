import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  CUSTOMER = 'customer',
  STORE_MANAGER = 'store_manager',
  ADMIN = 'admin',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: Record<string, unknown>) => {
      delete ret['password'];
      delete ret['refreshTokenHash'];
      delete ret['passwordChangedAt'];
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

  @Prop({ required: true, select: false })
  password!: string;

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

  /** The current valid refresh token hash. Nulled out on logout. */
  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;

  /**
   * The PREVIOUS refresh token hash, kept for a short grace window (10s).
   * This allows two near-simultaneous page reloads to both succeed even
   * though token rotation means the first load's response hasn't settled
   * into the browser's cookie jar before the second load fires its request.
   */
  @Prop({ type: String, select: false, default: null })
  prevRefreshTokenHash?: string | null;

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
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Compound index — efficient lookups filtering by both email and active status.
UserSchema.index({ email: 1, isActive: 1 });

// Hash password before saving (only when it has been modified).
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Record when the password was last changed so old tokens can be invalidated.
  this.passwordChangedAt = new Date();
});
