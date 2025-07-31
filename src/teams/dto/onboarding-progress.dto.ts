export class OnboardingProgressDto {
  step: number;
  data?: {
    name?: string;
    description?: string;
    standupTime?: string;
    timezone?: string;
    reminderMinutes?: number;
    memberEmails?: string[];
    punctualityGoal?: number;
    engagementGoal?: number;
  };
}

export class OnboardingProgressResponseDto {
  success: boolean;
  data: OnboardingProgressDto;
} 