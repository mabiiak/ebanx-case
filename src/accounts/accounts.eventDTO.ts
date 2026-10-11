import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty({ example: 'deposit' })
  type: string;

  @ApiProperty({ example: 100 })
  amount: number;
  
  @ApiPropertyOptional({ example: 30 })
  destination?: number;

  
  @ApiPropertyOptional({ example: 30 })
  origin?: number;
}