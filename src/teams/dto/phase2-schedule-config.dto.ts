import { IsString, IsNumber, IsIn } from 'class-validator';

export class Phase2ScheduleConfigDto {
  @IsString()
  standupTime: string;

  @IsString()
  timezone: string;

  @IsNumber()
  @IsIn([5, 10, 15, 30], { message: 'Reminder time must be 5, 10, 15, or 30 minutes' })
  reminderMinutes: number;
} 