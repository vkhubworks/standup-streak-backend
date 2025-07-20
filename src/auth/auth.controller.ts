import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res) {
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
} 