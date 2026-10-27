import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity.js';
import { FilterListingsDto } from './dto/filter-listings.dto.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
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

  // same struct libghay  frontend (Listing فـ types/index.ts)
  private toResponse(l: Listing) {
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
