import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: Record<string, unknown>) => {
      delete ret['password'];
      delete ret['refreshTokenHash'];
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

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({
    required: true,
    enum: ['customer', 'store_manager', 'admin'],
    default: 'customer',
  })
  role!: 'customer' | 'store_manager' | 'admin';

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ select: false })
  refreshTokenHash?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
