import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PROPERTY_TYPES } from './filter-listings.dto.js';

export class CreateListingDto {
  @IsString()
  @Length(3, 120)
  title: string;

  @IsString()
  @Length(10, 2000)
  description: string;

  @IsIn(PROPERTY_TYPES)
  type: string;

  @IsString()
  @Length(1, 80)
  cityAr: string;

  @IsString()
  @Length(1, 80)
  cityFr: string;

  @IsString()
  @Length(1, 80)
  cityEn: string;

  @IsString()
  @Length(2, 80)
  district: string;

  @IsInt()
  @Min(1)
  @Max(10000000)
  price: number;

  @IsInt()
  @Min(0)
  @Max(50)
  bedrooms: number;

  @IsBoolean()
  hasWifi: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsString()
  video?: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
