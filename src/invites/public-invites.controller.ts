import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('invites')
export class PublicInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get('verify')
  async verifyInvite(@Query('token') token: string): Promise<ApiResponse> {
    try {
      const invite = await this.invitesService.getInviteByToken(token);
      return { success: true, data: invite };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('accept')
  async acceptInvite(@Body() body: { token: string }): Promise<ApiResponse> {
    try {
      const invite = await this.invitesService.getInviteByToken(body.token);
      if (!invite) {
        return { success: false, message: 'Invalid or expired invite token.' };
      }

      // Proceed with invite acceptance logic
      return { success: true, message: 'Invite accepted. Please create an account.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('decline')
  async declineInvite(@Body() body: { token: string }): Promise<ApiResponse> {
    try {
      const result = await this.invitesService.declineInvite(body.token);
      return { success: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
