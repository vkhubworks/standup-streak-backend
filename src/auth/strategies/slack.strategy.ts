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