import { IsIn, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';


export const SORT_FIELDS = ['id', 'price', 'bedrooms'] as const;
export const SORT_ORDERS = ['ASC', 'DESC'] as const;

export const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'riad', 'villa'] as const;

export class FilterListingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
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

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?:(typeof SORT_ORDERS)[number];

  @IsOptional()
  @Type(()=> Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(()=> Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  minBedrooms?: number;
}
