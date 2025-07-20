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

  @Prop({ default: 'local' })
  provider: string;

  // createdAt will be auto-managed by Mongoose
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 