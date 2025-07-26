# Slack OAuth Integration Architectural Plan

This document outlines the architecture and implementation plan for adding Slack OAuth authentication to the existing NestJS backend application.

## 1. Overview

The integration will follow the same pattern as the existing Google OAuth implementation, with specific adaptations for Slack's OAuth 2.0 flow. The implementation will allow users to authenticate using their Slack accounts, either for login or signup.

## 2. Environment Variables

Add the following environment variables to your `.env` file:

```
# Slack OAuth Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=f218016f5f05bbbed33c396ccfa9d93f
SLACK_SIGNING_SECRET=3d08621ff7cb0e175b692def95caf340
SLACK_VERIFICATION_TOKEN=oSBLlvpxnN9vR3neCoTEFbMi
SLACK_REDIRECT_URI=http://localhost:3000/api/auth/callback/slack
```

## 3. Dependencies

Add the following dependency to your project:

```bash
npm install passport-slack-oauth2
```

## 4. New Files

### 4.1. Slack Strategy (`src/auth/strategies/slack.strategy.ts`)

Create a new Passport strategy for Slack OAuth:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-slack-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackStrategy extends PassportStrategy(Strategy, 'slack') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('SLACK_CLIENT_ID'),
      clientSecret: configService.get<string>('SLACK_CLIENT_SECRET'),
      callbackURL: configService.get<string>('SLACK_REDIRECT_URI'),
      scope: ['identity.basic', 'identity.email', 'identity.avatar'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { id, user } = profile;
    const { email, name, image_512 } = user;
    
    const userData = {
      slack_id: id,
      email,
      name,
      profile_picture: image_512,
      provider: 'slack',
    };

    return userData;
  }
}
```

## 5. Changes to Existing Files

### 5.1. Auth Module (`src/auth/auth.module.ts`)

Update the Auth module to include the Slack strategy:

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SlackStrategy } from './strategies/slack.strategy'; // Add this import
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SlackStrategy, ConfigService], // Add SlackStrategy
})
export class AuthModule {}
```

### 5.2. Auth Controller (`src/auth/auth.controller.ts`)

Add new endpoints for Slack OAuth:

```typescript
// The existing endpoint for Slack OAuth is already in place
@Get('oauth/slack')
async slackOAuth(@Res() res) {
  return this.authService.getSlackOAuthUrl(res);
}

// Add these new endpoints
@Get('oauth/slack-login')
async slackLoginOAuth(@Res() res) {
  return this.authService.getSlackOAuthUrl(res, 'login');
}

@Get('oauth/slack-signup')
async slackSignupOAuth(@Res() res) {
  return this.authService.getSlackOAuthUrl(res, 'signup');
}

@Get('callback/slack')
async slackCallback(@Query() query, @Res() res) {
  // Pass mode from state or query
  const mode = query.state || query.mode || 'login';
  return this.authService.handleSlackOAuthCallback({ ...query, mode }, res);
}

@Post('slack')
async slackAuthPost(@Body('code') code: string, @Res() res) {
  // Reuse the same logic as the callback, but with code from body
  return this.authService.handleSlackOAuthCallback({ code }, res);
}
```

### 5.3. Auth Service (`src/auth/auth.service.ts`)

Implement the Slack OAuth URL generation and callback handling methods:

```typescript
// Complete the implementation of the existing getSlackOAuthUrl method
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

// Add a new method for handling Slack OAuth callbacks
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
```

## 6. Database Schema

No changes are needed to the database schema, as the User model already includes a `slack_id` field:

```typescript
// src/users/user.model.ts
@Prop()
slack_id?: string;
```

The `UsersService` also already includes a method to find users by provider ID, including Slack:

```typescript
// src/users/user.service.ts
async findByProviderId(provider: string, providerId: string): Promise<User | null> {
  if (provider === 'google') {
    return this.userModel.findOne({ google_id: providerId }).exec();
  } else if (provider === 'slack') {
    return this.userModel.findOne({ slack_id: providerId }).exec();
  }
  return null;
}
```

## 7. Authentication Flow

The Slack OAuth authentication flow will work as follows:

1. **Initiate OAuth**: User clicks on "Sign in with Slack" or "Sign up with Slack" button on the frontend
2. **Redirect to Slack**: Frontend calls `/api/auth/oauth/slack-login` or `/api/auth/oauth/slack-signup` endpoint
3. **Authorization**: User authorizes the application on Slack
4. **Callback**: Slack redirects back to `/api/auth/callback/slack` with an authorization code
5. **Token Exchange**: Backend exchanges the code for an access token
6. **User Info**: Backend uses the access token to get the user's profile information
7. **User Lookup/Creation**: Backend finds or creates a user based on the Slack ID or email
8. **JWT Issuance**: Backend generates a JWT token and redirects to the frontend
9. **Authentication Complete**: Frontend stores the token and uses it for authenticated requests

## 8. Implementation Steps

1. Install the required dependency: `passport-slack-oauth2`
2. Add the Slack OAuth environment variables to your `.env` file
3. Create the Slack strategy file: `src/auth/strategies/slack.strategy.ts`
4. Update the Auth module to include the Slack strategy
5. Add the new endpoints to the Auth controller
6. Implement the Slack OAuth URL generation and callback handling methods in the Auth service
7. Test the implementation by trying to sign in and sign up with Slack

## 9. Security Considerations

1. **Environment Variables**: Keep your Slack client secret and other sensitive information in environment variables, not in the code
2. **Token Validation**: Always validate tokens received from Slack
3. **Error Handling**: Implement proper error handling for all API calls
4. **Rate Limiting**: Consider implementing rate limiting for the OAuth endpoints to prevent abuse
5. **Logging**: Log OAuth attempts for security auditing, but be careful not to log sensitive information

## 10. Testing

Test the Slack OAuth integration with the following scenarios:

1. **New User Signup**: Test signing up a new user with Slack
2. **Existing User Login**: Test logging in an existing user with Slack
3. **Error Handling**: Test error scenarios (e.g., user denies authorization, Slack API errors)
4. **Edge Cases**: Test edge cases (e.g., user with same email already exists but with different auth method)

This plan provides a comprehensive roadmap for implementing Slack OAuth integration in your NestJS backend application. Follow these steps to add Slack authentication alongside your existing Google authentication system.