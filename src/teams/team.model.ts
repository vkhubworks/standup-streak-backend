import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Team extends Document {
  @Prop({ required: true, minlength: 3, maxlength: 50, unique: false })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  adminId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  pendingInvites: string[];

  @Prop({ type: [{ email: String, invitedAt: Date, status: String }], default: [] })
  inviteHistory: {
    email: string;
    invitedAt: Date;
    status: string;
  }[];

  // Schedule Configuration
  @Prop({ required: true, default: '09:00' })
  standupTime: string;

  @Prop({ required: true, default: 'UTC-8' })
  timezone: string;

  @Prop({ required: true, default: 5 })
  reminderMinutes: number;

  // Goals & Targets
  @Prop({ required: true, min: 70, max: 100, default: 90 })
  punctualityGoal: number;

  @Prop({ required: true, min: 70, max: 100, default: 85 })
  engagementGoal: number;

  // Onboarding Progress
  @Prop({ required: true, default: 0 })
  onboardingStep: number;

  @Prop({ default: false })
  onboardingCompleted: boolean;

  // createdAt and updatedAt will be auto-managed by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const TeamSchema = SchemaFactory.createForClass(Team); 