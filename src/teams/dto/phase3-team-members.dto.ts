import { IsArray, IsEmail, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class Phase3TeamMembersDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one team member is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 team members allowed' })
  @IsEmail({}, { each: true, message: 'Each email must be in valid format' })
  memberEmails: string[];
} 