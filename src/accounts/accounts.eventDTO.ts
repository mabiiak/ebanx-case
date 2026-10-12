import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString, Min } from 'class-validator';
export class EventDto {
  @ApiProperty({ example: 'deposit' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 100,  minimum: 0 })
  @Type(() => Number)
  @Min(0)
  @IsNotEmpty()
  amount: number;
  
  @ApiPropertyOptional({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  destination?: number;

  
  @ApiPropertyOptional({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  origin?: number;
}