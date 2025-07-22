import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res) {
    console.log('Register API triggered for email:', dto.email);
    const result = await this.authService.register(dto);
    if ('error' in result) return res.status(400).json(result);
    return res.json(result);
  }

  @Get('oauth/google')
  async googleOAuth(@Res() res) {
    return this.authService.getGoogleOAuthUrl(res);
  }

  @Get('oauth/slack')
  async slackOAuth(@Res() res) {
    return this.authService.getSlackOAuthUrl(res);
  }

  @Get('oauth/callback')
  async oauthCallback(@Query() query, @Res() res) {
    const result = await this.authService.handleOAuthCallback(query, res);
    if ('error' in result) return res.status(400).json(result);
    return res.json(result);
  }

  @Get('oauth/google-login')
  async googleLoginOAuth(@Res() res) {
    return this.authService.getGoogleOAuthUrl(res, 'login');
  }

  @Get('oauth/google-signup')
  async googleSignupOAuth(@Res() res) {
    return this.authService.getGoogleOAuthUrl(res, 'signup');
  }

  @Get('callback/google')
  async googleCallback(@Query() query, @Res() res) {
    // Pass mode from state or query
    const mode = query.state || query.mode || 'login';
    return this.authService.handleOAuthCallback({ ...query, mode }, res);
  }

  @Post('google')
  async googleAuthPost(@Body('code') code: string, @Res() res) {
    // Reuse the same logic as the callback, but with code from body
    return this.authService.handleOAuthCallback({ code }, res);
  }

  @Post('login')
  async login(@Body() body, @Res() res) {
    const result = await this.authService.login(body);
    if (result.error) {
      return res.status(result.statusCode || 400).json({ error: result.error });
    }
    return res.json(result);
  }
} 