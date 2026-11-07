import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { Listing } from './listing.entity.js';
import { FilterListingsDto } from './dto/filter-listings.dto.js';
import { uploadsBaseUrl } from './upload-options.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(filters: FilterListingsDto) {
    const qb = this.listingRepository.createQueryBuilder('listing');

    if (filters.city) {
      qb.andWhere(
        '(listing.cityAr ILIKE :city OR listing.cityFr ILIKE :city OR listing.cityEn ILIKE :city)',
        { city: `%${filters.city.trim()}%` },
      );
    }

    if (filters.type) {
      qb.andWhere('listing.type = :type', { type: filters.type });
    }

    if (filters.minPrice !== undefined) {
      qb.andWhere('listing.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('listing.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    const listings = await qb.orderBy('listing.id', 'DESC').getMany();

    return listings.map((l) => this.toResponse(l));
  }

  async findByOwner(ownerId: number) {
    const listings = await this.listingRepository.find({
      where: { ownerId },
      order: { id: 'DESC' },
    });

    return listings.map((listing) => this.toResponse(listing));
  }

  async create(ownerId: number, data: CreateListingDto) {
    const uploadedFiles = data.video ? [...data.images, data.video] : data.images;

    if (!uploadedFiles.every((url) => url.startsWith(uploadsBaseUrl()))) {
      throw new BadRequestException('Images and video must be uploaded first');
    }

    const owner = await this.userRepository.findOneBy({ id: ownerId });

    if (!owner) {
      throw new NotFoundException('User not found');
    }

    const listing = await this.listingRepository.save(
      this.listingRepository.create({
        ownerId,
        ownerName: `${owner.firstName} ${owner.lastName}`,
        titleAr: data.title,
        titleFr: data.title,
        titleEn: data.title,
        descriptionAr: data.description,
        descriptionFr: data.description,
        descriptionEn: data.description,
        cityAr: data.cityAr,
        cityFr: data.cityFr,
        cityEn: data.cityEn,
        district: data.district,
        districtEnFr: data.district,
        type: data.type,
        price: data.price,
        bedrooms: data.bedrooms,
        hasWifi: data.hasWifi,
        imageUrl: data.images[0],
        images: data.images,
        video: data.video,
        lat: data.lat,
        lng: data.lng,
      }),
    );

    return this.toResponse(listing);
  }

  // same struct libghay  frontend (Listing فـ types/index.ts)
  toResponse(l: Listing) {
    return {
      id: l.id,
      ownerId: l.ownerId,
      city: { ar: l.cityAr, fr: l.cityFr, en: l.cityEn },
      title: { ar: l.titleAr, fr: l.titleFr, en: l.titleEn },
      description: { ar: l.descriptionAr, fr: l.descriptionFr, en: l.descriptionEn },
      district: l.district,
      districtEnFr: l.districtEnFr,
      price: l.price,
      bedrooms: l.bedrooms,
      hasWifi: l.hasWifi,
      imageUrl: l.imageUrl,
      images: l.images ?? [],
      video: l.video ?? undefined,
      ownerName: l.ownerName,
      lat: l.lat,
      lng: l.lng,
      type: l.type,
    };
  }
}
