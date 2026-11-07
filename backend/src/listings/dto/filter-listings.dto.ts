import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'riad', 'villa'] as const;

export class FilterListingsDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: (typeof PROPERTY_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;
}
