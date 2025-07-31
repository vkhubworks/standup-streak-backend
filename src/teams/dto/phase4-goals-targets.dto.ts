import { IsNumber, Min, Max } from 'class-validator';

export class Phase4GoalsTargetsDto {
  @IsNumber()
  @Min(70, { message: 'Punctuality goal must be at least 70%' })
  @Max(100, { message: 'Punctuality goal cannot exceed 100%' })
  punctualityGoal: number;

  @IsNumber()
  @Min(70, { message: 'Engagement goal must be at least 70%' })
  @Max(100, { message: 'Engagement goal cannot exceed 100%' })
  engagementGoal: number;
} 