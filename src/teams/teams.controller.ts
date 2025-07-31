import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  Param,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Phase1TeamSetupDto } from './dto/phase1-team-setup.dto';
import { Phase2ScheduleConfigDto } from './dto/phase2-schedule-config.dto';
import { Phase3TeamMembersDto } from './dto/phase3-team-members.dto';
import { Phase4GoalsTargetsDto } from './dto/phase4-goals-targets.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // Get onboarding progress
  @Get('onboarding/progress')
  async getOnboardingProgress(@Request() req) {
    const progress = await this.teamsService.getOnboardingProgress(req.user.userId);
    return {
      success: true,
      data: progress
    };
  }

  // Phase 1: Team Setup
  @Post('onboarding/phase1')
  @HttpCode(HttpStatus.OK)
  async savePhase1(@Request() req, @Body() data: Phase1TeamSetupDto) {
    const result = await this.teamsService.savePhase1(req.user.userId, data);
    return {
      success: true,
      message: 'Team setup saved successfully',
      data: result
    };
  }

  // Phase 2: Schedule Configuration
  @Post('onboarding/phase2')
  @HttpCode(HttpStatus.OK)
  async savePhase2(@Request() req, @Body() data: Phase2ScheduleConfigDto) {
    const result = await this.teamsService.savePhase2(req.user.userId, data);
    return {
      success: true,
      message: 'Schedule configuration saved successfully',
      data: result
    };
  }

  // Phase 3: Team Members
  @Post('onboarding/phase3')
  @HttpCode(HttpStatus.OK)
  async savePhase3(@Request() req, @Body() data: Phase3TeamMembersDto) {
    const result = await this.teamsService.savePhase3(req.user.userId, data);
    return {
      success: true,
      message: 'Team members saved successfully',
      data: result
    };
  }

  // Phase 4: Goals & Targets
  @Post('onboarding/phase4')
  @HttpCode(HttpStatus.OK)
  async savePhase4(@Request() req, @Body() data: Phase4GoalsTargetsDto) {
    const result = await this.teamsService.savePhase4(req.user.userId, data);
    return {
      success: true,
      message: 'Goals and targets saved successfully',
      data: result
    };
  }

  // Complete onboarding
  @Post('onboarding/complete')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@Request() req) {
    const result = await this.teamsService.completeOnboarding(req.user.userId);
    return {
      success: true,
      message: result.message,
      data: {
        teamId: result.teamId
      }
    };
  }

  // Get team details
  @Get(':teamId')
  async getTeam(@Param('teamId') teamId: string) {
    const team = await this.teamsService.getTeam(teamId);
    return {
      success: true,
      data: team
    };
  }

  // Get user's teams
  @Get()
  async getUserTeams(@Request() req) {
    const teams = await this.teamsService.getUserTeams(req.user.userId);
    return {
      success: true,
      data: teams
    };
  }
} 