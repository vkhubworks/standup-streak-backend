

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Invite, InviteStatus } from './invite.model';
import { Team } from '../teams/team.model';
import { User } from '../users/user.model';
import { EmailService } from '../emails/email.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Invite.name) private inviteModel: Model<Invite>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async getTeamInvites(teamId: string, userId: string): Promise<any[]> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    // Only admin can list invites
    if (team.adminId.toString() !== userId) {
      throw new BadRequestException('Access denied');
    }
    const invites = await this.inviteModel.find({ teamId: new Types.ObjectId(teamId) });
    return invites;
  }

  async sendTeamInvites(
    teamId: string,
    invites: { email: string; role: string }[],
    inviterId: string,
  ): Promise<{ sent: number; failed: string[] }> {
    const team = await this.teamModel.findById(teamId).populate('adminId', 'name email');
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const inviter = await this.userModel.findById(inviterId).select('name email');
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    let sent = 0;
    const failed: string[] = [];

    for (const inviteObj of invites) {
      const { email, role } = inviteObj;
      try {
        // Check if user already exists and is member
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser && team.members.includes(existingUser._id as Types.ObjectId)) {
          failed.push(`${email}: Already a team member`);
          continue;
        }

        // Check for existing pending invite
        const existingInvite = await this.inviteModel.findOne({
          teamId: new Types.ObjectId(teamId),
          email,
          status: InviteStatus.PENDING,
        });

        if (existingInvite) {
          // Resend existing invite
          await this.resendInvite((existingInvite._id as Types.ObjectId).toString(), inviterId);
          sent++;
        } else {
          // Create new invite
          const token = this.generateInviteToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

          const invite = new this.inviteModel({
            teamId: new Types.ObjectId(teamId),
            invitedBy: new Types.ObjectId(inviterId),
            email,
            token,
            expiresAt,
            lastSentAt: new Date(),
            role, // Save role if you want to store it (add to schema if needed)
          });

          await invite.save();

          // Send email

          const emailSent = await this.emailService.sendTeamInvite(
            email,
            team.name,
            inviter?.name || 'Admin',
            token,
          );

          if (emailSent) {
            sent++;
          } else {
            failed.push(`${email}: Failed to send email`);
            invite.status = InviteStatus.EXPIRED;
            await invite.save();
          }
        }
      } catch (error) {
        failed.push(`${email}: ${error.message}`);
      }
    }

    return { sent, failed };
  }

  async resendInvite(inviteId: string, userId: string): Promise<boolean> {
    const invite = await this.inviteModel.findById(inviteId).populate({
      path: 'teamId',
      populate: { path: 'adminId', select: 'name email' }
    });

    if (!invite || invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Invalid or expired invite');
    }

    // Verify permissions
    const team = invite.teamId as any;
    if (team.adminId._id.toString() !== userId) {
      throw new BadRequestException('Access denied');
    }

    const inviter = await this.userModel.findById(userId).select('name email');
    const emailSent = await this.emailService.sendTeamInvite(
      invite.email,
      team.name,
      inviter?.name || 'Admin',
      invite.token,
    );

    if (emailSent) {
      invite.lastSentAt = new Date();
      invite.sentCount += 1;
      await invite.save();
      return true;
    }
    return false;
  }

  async revokeInvite(inviteId: string, userId: string): Promise<boolean> {
    const invite = await this.inviteModel.findById(inviteId).populate('teamId');
    if (!invite || invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Invalid or expired invite');
    }
    // Verify permissions
    const team = invite.teamId as any;
    if (team.adminId.toString() !== userId) {
      throw new BadRequestException('Access denied');
    }
    invite.status = InviteStatus.REVOKED;
    invite.revokedAt = new Date();
    invite.revokedBy = new Types.ObjectId(userId);
    await invite.save();
    return true;
  }

  async acceptInvite(token: string, userId: string): Promise<{ teamId: string; teamName: string }> {
    const invite = await this.inviteModel.findOne({ 
      token, 
      status: InviteStatus.PENDING 
    }).populate('teamId');
    if (!invite) {
      throw new BadRequestException('Invalid or expired invitation');
    }
    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await invite.save();
      throw new BadRequestException('Invitation has expired');
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Verify email matches
    if (invite.email !== user.email) {
      throw new BadRequestException('Invitation email does not match your account email');
    }
    const team = invite.teamId as any;
    // Check if already a member
    if (team.members.includes(new Types.ObjectId(userId))) {
      throw new BadRequestException('You are already a member of this team');
    }
    // Add user to team
    team.members.push(new Types.ObjectId(userId));
    // Remove from pending invites
    team.pendingInvites = team.pendingInvites.filter(email => email !== invite.email);
    await team.save();
    // Update invite status
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    invite.acceptedBy = new Types.ObjectId(userId);
    await invite.save();
    return {
      teamId: team._id.toString(),
      teamName: team.name,
    };
  }

  async declineInvite(token: string): Promise<boolean> {
    const invite = await this.inviteModel.findOne({ 
      token, 
      status: InviteStatus.PENDING 
    });
    if (!invite) {
      throw new BadRequestException('Invalid or expired invitation');
    }
    invite.status = InviteStatus.REVOKED;
    invite.revokedAt = new Date();
    await invite.save();
    return true;
  }

  private generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async getInviteByToken(token: string): Promise<any> {
    const invite = await this.inviteModel
      .findOne({ token, status: InviteStatus.PENDING })
      .populate('teamId', 'name description')
      .populate('invitedBy', 'name email');
    if (!invite) {
      throw new NotFoundException('Invalid or expired invitation');
    }
    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await invite.save();
      throw new BadRequestException('Invitation has expired');
    }
    return {
      email: invite.email,
      team: {
        name: (invite.teamId as any).name,
        description: (invite.teamId as any).description,
      },
      invitedBy: {
        name: (invite.invitedBy as any).name,
      },
      expiresAt: invite.expiresAt,
    };
  }
}
