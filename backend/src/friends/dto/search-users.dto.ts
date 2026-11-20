import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

// The query string of GET /friends/search?q=sara. The global ValidationPipe
// (main.ts) checks it and answers 400 on its own when it is wrong, before our
// code runs.
export class SearchUsersDto {
  // Spaces around the text are removed first, so "  " counts as empty.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  q!: string;
}
