import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

@Schema({ timestamps: true })
export class Invite extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Team' })
  teamId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  invitedBy: Types.ObjectId;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        // Simple email regex
        return /^([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,})$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email address!`,
    },
  })
  email: string;
  @Prop({
    required: true,
    enum: ['member', 'admin'],
    default: 'member',
    validate: {
      validator: function (v: string) {
        return ['member', 'admin'].includes(v);
      },
      message: (props: any) => `${props.value} is not a valid role!`,
    },
  })
  role: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedBy?: Types.ObjectId;

  @Prop()
  revokedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  revokedBy?: Types.ObjectId;

  @Prop()
  lastSentAt: Date;

  @Prop({ default: 1 })
  sentCount: number;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

InviteSchema.index({ token: 1 });
InviteSchema.index({ teamId: 1, email: 1 });
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
