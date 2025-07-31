import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class Phase1TeamSetupDto {
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Team name cannot exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Team description cannot exceed 500 characters' })
  description?: string;
} 