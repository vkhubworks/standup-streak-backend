import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './team.model';
import { User } from '../users/user.model';
import { Phase1TeamSetupDto } from './dto/phase1-team-setup.dto';
import { Phase2ScheduleConfigDto } from './dto/phase2-schedule-config.dto';
import { Phase3TeamMembersDto } from './dto/phase3-team-members.dto';
import { Phase4GoalsTargetsDto } from './dto/phase4-goals-targets.dto';
import { InvitesService } from '../invites/invites.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
    private invitesService: InvitesService,
  ) {}

  // Get onboarding progress for a user
  async getOnboardingProgress(userId: string) {
    try {
      const team = await this.teamModel.findOne({ 
        adminId: new Types.ObjectId(userId),
        onboardingCompleted: false 
      });

      console.log(`Progress check for user ${userId}:`, team ? `Found team ${team._id}, step ${team.onboardingStep}` : 'No team found');

      if (!team) {
        return { step: 0, data: null };
      }

      return {
        step: team.onboardingStep,
        data: {
          name: team.name,
          description: team.description,
          standupTime: team.standupTime,
          timezone: team.timezone,
          reminderMinutes: team.reminderMinutes,
          memberEmails: team.pendingInvites,
          punctualityGoal: team.punctualityGoal,
          engagementGoal: team.engagementGoal,
        }
      };
    } catch (error) {
      console.error('Error in getOnboardingProgress:', error);
      throw error;
    }
  }

  // Phase 1: Team Setup
  async savePhase1(userId: string, data: Phase1TeamSetupDto) {
    try {
      let team = await this.teamModel.findOne({ 
        adminId: new Types.ObjectId(userId),
        onboardingCompleted: false 
      });

      if (!team) {
        // Create new team
        team = new this.teamModel({
          adminId: new Types.ObjectId(userId),
          name: data.name,
          description: data.description,
          onboardingStep: 1,
          onboardingCompleted: false
        });
      } else {
        // Update existing team
        team.name = data.name;
        team.description = data.description;
        team.onboardingStep = 1;
      }
      
      await team.save();
      console.log(`Team created/updated for user ${userId}, teamId: ${team._id}, step: ${team.onboardingStep}`);
      
      return { success: true, teamId: team._id };
    } catch (error) {
      console.error('Error in savePhase1:', error);
      throw error;
    }
  }

  // Phase 2: Schedule Configuration
  async savePhase2(userId: string, data: Phase2ScheduleConfigDto) {
    try {
      const team = await this.teamModel.findOne({ 
        adminId: new Types.ObjectId(userId),
        onboardingCompleted: false 
      });

      console.log(`Phase 2 check for user ${userId}:`, team ? `Found team ${team._id}, current step ${team.onboardingStep}` : 'No team found');

      if (!team) {
        throw new NotFoundException('No team found for onboarding. Please complete Phase 1 first.');
      }

      team.standupTime = data.standupTime;
      team.timezone = data.timezone;
      team.reminderMinutes = data.reminderMinutes;
      team.onboardingStep = 2;
      
      await team.save();
      console.log(`Phase 2 completed for user ${userId}, team ${team._id}, step updated to ${team.onboardingStep}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error in savePhase2:', error);
      throw error;
    }
  }

  // Phase 3: Team Members
  async savePhase3(userId: string, data: Phase3TeamMembersDto) {
    const team = await this.teamModel.findOne({ 
      adminId: new Types.ObjectId(userId),
      onboardingCompleted: false 
    });

    if (!team) {
      throw new NotFoundException('No team found for onboarding');
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(data.memberEmails)];
    // Check for existing users
    const existingUsers = await this.userModel.find({
      email: { $in: uniqueEmails }
    });
    const existingEmails = existingUsers.map(user => user.email);
    const newEmails = uniqueEmails.filter(email => !existingEmails.includes(email));
    // Add existing users to members
    const existingUserIds = existingUsers.map(user => user._id);
    team.members = [...new Set([...team.members, ...existingUserIds])] as Types.ObjectId[];
    // Add new emails to pending invites
    team.pendingInvites = newEmails;
    team.onboardingStep = 3;
    await team.save();

    // Send invitations automatically
    let inviteResult: { sent: number; failed: string[] } = { sent: 0, failed: [] };
    if (newEmails.length > 0) {
      try {
        inviteResult = await this.invitesService.sendTeamInvites(
          (team._id as Types.ObjectId).toString(),
          newEmails.map(email => ({ email, role: 'member' })),
          userId,
        );
      } catch (error) {
        console.error('Failed to send invites:', error);
        inviteResult.failed = newEmails;
      }
    }

    return {
      success: true,
      existingUsers: existingEmails.length,
      pendingInvites: newEmails.length,
      invitesSent: inviteResult.sent,
      invitesFailed: inviteResult.failed,
    };
  }

  // Phase 4: Goals & Targets
  async savePhase4(userId: string, data: Phase4GoalsTargetsDto) {
    const team = await this.teamModel.findOne({ 
      adminId: new Types.ObjectId(userId),
      onboardingCompleted: false 
    });

    if (!team) {
      throw new NotFoundException('No team found for onboarding');
    }

    team.punctualityGoal = data.punctualityGoal;
    team.engagementGoal = data.engagementGoal;
    team.onboardingStep = 4;
    
    await team.save();
    return { success: true };
  }

  // Complete onboarding
  async completeOnboarding(userId: string) {
    const team = await this.teamModel.findOne({ 
      adminId: new Types.ObjectId(userId),
      onboardingCompleted: false 
    });

    if (!team) {
      throw new NotFoundException('No team found for onboarding');
    }

    if (team.onboardingStep < 4) {
      throw new BadRequestException('All phases must be completed before finalizing');
    }

    team.onboardingCompleted = true;
    await team.save();

    return { 
      success: true, 
      teamId: team._id,
      message: 'Team setup completed successfully!' 
    };
  }

  // Get team details
  async getTeam(teamId: string) {
    const team = await this.teamModel.findById(teamId)
      .populate('members', 'name email profile_picture')
      .populate('adminId', 'name email profile_picture');

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  // Get user's teams
  async getUserTeams(userId: string) {
    return await this.teamModel.find({
      $or: [
        { adminId: new Types.ObjectId(userId) },
        { members: new Types.ObjectId(userId) }
      ]
    }).populate('adminId', 'name email');
  }
} 