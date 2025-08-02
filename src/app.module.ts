import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { TeamsModule } from './teams/teams.module';
import { InvitesModule } from './invites/invites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL') || 'mongodb://localhost:27017/standup',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TeamsModule,
    InvitesModule,
  ],
})
export class AppModule {}
