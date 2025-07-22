import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  google_id?: string;

  @Prop()
  slack_id?: string;

  @Prop()
  profile_picture?: string;

  @Prop({ default: 'manual' })
  signup_method: string;

  // createdAt will be auto-managed by Mongoose
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 