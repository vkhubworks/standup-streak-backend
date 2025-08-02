import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitesService } from './invites.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';

export class InviteInputDto {
  email: string;
  role: string;
}

export class SendInvitesDto {
  teamId: string;
  invites: InviteInputDto[];
}

export class InviteActionDto {
  inviteId: string;
}

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('send')
  async sendInvites(@Request() req, @Body() body: SendInvitesDto): Promise<ApiResponse> {
    // Validate input
    if (!body.teamId || !body.invites || !Array.isArray(body.invites) || body.invites.length === 0) {
      return { success: false, message: 'teamId and invites[] are required.' };
    }
    try {
      const result = await this.invitesService.sendTeamInvites(
        body.teamId,
        body.invites,
        req.user?.userId || 'test-user-id'
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('team/:teamId')
  async getTeamInvites(@Request() req, @Param('teamId') teamId: string): Promise<ApiResponse> {
    try {
      // Only admin can list invites
      const invites = await this.invitesService.getTeamInvites(teamId, req.user?.userId || 'test-user-id');
      return { success: true, data: invites };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('resend')
  async resendInvite(@Request() req, @Body() body: InviteActionDto): Promise<ApiResponse> {
    try {
      const result = await this.invitesService.resendInvite(body.inviteId, req.user?.userId || 'test-user-id');
      return { success: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('revoke')
  async revokeInvite(@Request() req, @Body() body: InviteActionDto): Promise<ApiResponse> {
    try {
      const result = await this.invitesService.revokeInvite(body.inviteId, req.user?.userId || 'test-user-id');
      return { success: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Removed verifyInvite from here; now in PublicInvitesController




}







