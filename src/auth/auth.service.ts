import { Injectable, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      signup_method: 'manual',
    });
    // Generate JWT
    const payload = { sub: user._id, email: user.email, name: user.name, signup_method: user.signup_method };
    const token = this.jwtService.sign(payload);
    // Return token and user object
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        signup_method: user.signup_method,
        createdAt: user.createdAt,
      },
    };
  }

  async getGoogleOAuthUrl(res, mode: 'login' | 'signup' = 'login') {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: 'Google OAuth is not configured properly.' });
    }
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');
    const url =
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&state=${mode}`;
    return res.json({ url });
  }

  async getSlackOAuthUrl(res, mode: 'login' | 'signup' = 'login') {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI');
    
    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: 'Slack OAuth is not configured properly.' });
    }
    
    // Define the scopes needed for user identification
    const scope = ['identity.basic', 'identity.email', 'identity.avatar'].join(' ');
    
    // Construct the Slack OAuth URL
    const url =
      'https://slack.com/oauth/v2/authorize' +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${mode}`;  // Pass mode as state parameter
    
    return res.json({ url });
  }

  async handleSlackOAuthCallback(query, res) {
    const code = query.code;
    const mode = query.mode || 'login';
    
    if (!code) {
      return { error: 'No code provided' };
    }
    
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI');
    
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ error: 'Slack OAuth is not configured properly.' });
    }
    
    try {
      // Exchange code for tokens
      const tokenRes = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          code: String(code),
          client_id: String(clientId),
          client_secret: String(clientSecret),
          redirect_uri: String(redirectUri),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      if (!tokenRes.data.ok) {
        throw new Error(`Slack API error: ${tokenRes.data.error}`);
      }
      
      const { access_token, authed_user } = tokenRes.data;
      const { id: slack_id } = authed_user;
      
      // Get user info
      const userInfoRes = await axios.get('https://slack.com/api/users.identity', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      if (!userInfoRes.data.ok) {
        throw new Error(`Slack API error: ${userInfoRes.data.error}`);
      }
      
      const { user } = userInfoRes.data;
      const { name, email, image_512: profile_picture } = user;
      
      // Log attempt
      console.log(`[Slack OAuth] ${mode} attempt for email: ${email}, slack_id: ${slack_id}`);
      
      // Find user by Slack ID or email
      let userRecord = await this.usersService.findByProviderId('slack', slack_id);
      if (!userRecord && email) {
        userRecord = await this.usersService.findByEmail(email);
      }
      
      if (mode === 'login') {
        if (!userRecord) {
          return res.redirect(`http://localhost:3001/auth/callback?error=No account found with this Slack login. Please sign up first.&mode=login`);
        }
        // Issue JWT, redirect with token
        const jwtPayload = { sub: userRecord._id, email: userRecord.email, name: userRecord.name, signup_method: userRecord.signup_method };
        const token = this.jwtService.sign(jwtPayload);
        return res.redirect(`http://localhost:3001/auth/callback?token=${token}`);
      } else if (mode === 'signup') {
        if (userRecord) {
          return res.redirect(`http://localhost:3001/auth/callback?error=This Slack account is already registered. Please log in instead.&mode=signup`);
        }
        // Create user, issue JWT, redirect with token
        userRecord = await this.usersService.createUser({
          name,
          email,
          slack_id,
          profile_picture,
          signup_method: 'slack',
        });
        const jwtPayload = { sub: userRecord._id, email: userRecord.email, name: userRecord.name, signup_method: userRecord.signup_method };
        const token = this.jwtService.sign(jwtPayload);
        return res.redirect(`http://localhost:3001/auth/callback?token=${token}`);
      } else {
        return res.redirect(`http://localhost:3001/auth/callback?error=Invalid mode for Slack OAuth.&mode=${mode}`);
      }
    } catch (err) {
      console.error('[Slack OAuth] Signup/Login error:', err);
      return res.status(400).json({ error: 'Slack OAuth failed', details: err?.response?.data || err.message });
    }
  }

  async handleOAuthCallback(query, res) {
    const code = query.code;
    const mode = query.mode || 'login';
    if (!code) {
      return { error: 'No code provided' };
    }
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ error: 'Google OAuth is not configured properly.' });
    }
    try {
      // Exchange code for tokens
      const tokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code: String(code),
          client_id: String(clientId),
          client_secret: String(clientSecret),
          redirect_uri: String(redirectUri),
          grant_type: 'authorization_code',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const { id_token } = tokenRes.data;
      // Verify and decode id_token
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Invalid Google ID token payload');
      const { email, name, sub: google_id, picture: profile_picture } = payload;
      // Log attempt
      console.log(`[Google OAuth] ${mode} attempt for email: ${email}, google_id: ${google_id}`);
      let user = await this.usersService.findByProviderId('google', google_id);
      if (!user && email) {
        user = await this.usersService.findByEmail(email);
      }
      if (mode === 'login') {
        if (!user) {
          return res.redirect(`http://localhost:3001/auth/callback?error=No account found with this Google login. Please sign up first.&mode=login`);
        }
        // Issue JWT, redirect with token
        const jwtPayload = { sub: user._id, email: user.email, name: user.name, signup_method: user.signup_method };
        const token = this.jwtService.sign(jwtPayload);
        return res.redirect(`http://localhost:3001/auth/callback?token=${token}`);
      } else if (mode === 'signup') {
        if (user) {
          return res.redirect(`http://localhost:3001/auth/callback?error=This Google account is already registered. Please log in instead.&mode=signup`);
        }
        // Create user, issue JWT, redirect with token
        user = await this.usersService.createUser({
          name,
          email,
          google_id,
          profile_picture,
          signup_method: 'google',
        });
        const jwtPayload = { sub: user._id, email: user.email, name: user.name, signup_method: user.signup_method };
        const token = this.jwtService.sign(jwtPayload);
        return res.redirect(`http://localhost:3001/auth/callback?token=${token}`);
      } else {
        return res.redirect(`http://localhost:3001/auth/callback?error=Invalid mode for Google OAuth.&mode=${mode}`);
      }
    } catch (err) {
      console.error('[Google OAuth] Signup/Login error:', err);
      return res.status(400).json({ error: 'Google OAuth failed', details: err?.response?.data || err.message });
    }
  }

  // In-memory brute-force protection (for demo; use Redis or DB in prod)
  private loginAttempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> = {};

  async login({ email, password }: { email: string; password: string }) {
    if (!email || !password) {
      return { error: 'Email and password are required.', statusCode: 400 };
    }
    const normalizedEmail = email.trim().toLowerCase();
    // Brute-force protection
    const now = Date.now();
    const attempts = this.loginAttempts[normalizedEmail] || { count: 0, lastAttempt: 0 };
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return { error: 'Account locked due to too many failed logins. Try again later or reset your password.', statusCode: 429 };
    }
    // Find user
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      return { error: 'No account found for this email.', statusCode: 404 };
    }
    // Account status checks (add fields to user model as needed)
    if ((user as any).isDeactivated) {
      return { error: 'Account is deactivated/disabled. Contact support for assistance', statusCode: 403 };
    }
    if ((user as any).isLocked) {
      return { error: 'Account locked. Please reset your password or contact support.', statusCode: 403 };
    }
    // Provider mismatch
    if (user.signup_method !== 'manual') {
      return { error: `Your account was created with ${user.signup_method}. Please login that way or link email/password from settings.`, statusCode: 400 };
    }
    // Password check
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) {
      // Increment brute-force counter
      attempts.count += 1;
      attempts.lastAttempt = now;
      if (attempts.count >= 5) {
        attempts.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
      }
      this.loginAttempts[normalizedEmail] = attempts;
      return { error: 'Invalid email or password.', statusCode: 401 };
    }
    // Reset brute-force counter on success
    this.loginAttempts[normalizedEmail] = { count: 0, lastAttempt: now };
    // Generate JWT
    const payload = { sub: user._id, email: user.email, name: user.name, signup_method: user.signup_method };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        signup_method: user.signup_method,
        createdAt: user.createdAt,
      },
    };
  }
} 