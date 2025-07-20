import { Injectable, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      return { error: 'Email already in use.' };
    }
    // Hash password
    const hashed = await bcrypt.hash(dto.password, 10);
    // Create user
    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      password: hashed,
      provider: 'local',
    });
    // Generate JWT
    const payload = { sub: user._id, email: user.email, name: user.name, provider: user.provider };
    const token = this.jwtService.sign(payload);
    // Return token and user object
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        createdAt: user.createdAt,
      },
    };
  }

  async getGoogleOAuthUrl(res) {
    // TODO: Implement Google OAuth redirect
    return res.json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?...' });
  }

  async getSlackOAuthUrl(res) {
    // TODO: Implement Slack OAuth redirect
    return res.json({ url: 'https://slack.com/oauth/v2/authorize?...' });
  }

  async handleOAuthCallback(query, res) {
    // TODO: Implement OAuth callback handling
    return { token: 'mock-oauth-token', user: { id: 'mock-id', name: 'OAuth User', email: 'oauth@example.com', provider: 'google' } };
  }
} 