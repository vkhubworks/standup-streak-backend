import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Invite, InviteSchema } from './invite.model';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { PublicInvitesController } from './public-invites.controller';
import { Team, TeamSchema } from '../teams/team.model';
import { User, UserSchema } from '../users/user.model';
import { EmailModule } from '../emails/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invite.name, schema: InviteSchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
    EmailModule,
  ],
  providers: [InvitesService],
  controllers: [InvitesController, PublicInvitesController],
  exports: [InvitesService],
})
export class InvitesModule {}
