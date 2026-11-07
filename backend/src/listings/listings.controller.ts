import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { FilterListingsDto } from './dto/filter-listings.dto.js';
import { ListingsService } from './listings.service.js';
import { MAX_UPLOAD_FILES, uploadOptions, uploadsBaseUrl } from './upload-options.js';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.listingsService.findByOwner(request.user!.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() data: CreateListingDto) {
    return this.listingsService.create(request.user!.sub, data);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', MAX_UPLOAD_FILES, uploadOptions))
  upload(@UploadedFiles() files: Express.Multer.File[] = []) {
    if (files.length === 0) {
      throw new BadRequestException('Choose at least one file');
    }

    return files.map((file) => uploadsBaseUrl() + file.filename);
  }
}
