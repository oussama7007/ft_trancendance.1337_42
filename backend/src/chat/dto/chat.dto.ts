import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MAX_AUDIO_DURATION_SECONDS,
  MAX_CAPTION_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PAGE_SIZE,
} from '../chat.constants.js';

export class SendMessageDto {
  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH)
  content!: string;
}

export class SendAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_CAPTION_LENGTH)
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_AUDIO_DURATION_SECONDS)
  duration?: number;
}

export class MessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  before?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_MESSAGES_PAGE_SIZE)
  limit?: number;
}

export class ConversationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
