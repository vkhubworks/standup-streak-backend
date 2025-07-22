import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    if (provider === 'google') {
      return this.userModel.findOne({ google_id: providerId }).exec();
    } else if (provider === 'slack') {
      return this.userModel.findOne({ slack_id: providerId }).exec();
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async createUser(data: Partial<User>): Promise<User> {
    if (data.email) {
      data.email = data.email.trim().toLowerCase();
    }
    const user = new this.userModel(data);
    return user.save();
  }
} 