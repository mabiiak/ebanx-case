import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString, Min, ValidateIf } from 'class-validator';
export class EventDto {
  @ApiProperty({ example: 'deposit' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 100,  minimum: 0 })
  @Type(() => Number)
  @IsPositive()
  amount: number;
  
  @ApiPropertyOptional({ example: 30 })
  @ValidateIf((o) => o.type === 'deposit' || o.type === 'transfer')
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  destination?: number;

  
  @ApiPropertyOptional({ example: 30 })
  @ValidateIf((o) => o.type === 'withdraw' || o.type === 'transfer')
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  origin?: number;
}