import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { Listing } from './listing.entity.js';
import { FilterListingsDto } from './dto/filter-listings.dto.js';
import { uploadsBaseUrl } from './upload-options.js';

const SORT_COLUMNS = {
  id: 'listing.id',
  price: 'listing.price',
  bedrooms: 'listing.bedrooms',
} as const;


const DEFAULT_LIMIT = 12;


@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(filters: FilterListingsDto) {

    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new BadRequestException('minPrice must be <= maxPrice');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_LIMIT;
    const sortColumn = SORT_COLUMNS[filters.sortBy ?? 'id'];
    const sortOrder = filters.sortOrder ?? 'DESC';

    const qb = this.listingRepository.createQueryBuilder('listing');

    const city = filters.city?.trim();
    if (city) {
      qb.andWhere(
        '(listing.cityAr ILIKE :city OR listing.cityFr ILIKE :city OR listing.cityEn ILIKE :city)',
        { city: `%${city}%` },
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

    if (filters.minBedrooms !== undefined){
      qb.andWhere('listing.bedrooms >= :minBedrooms',
        {minBedrooms: filters.minBedrooms},
      );
    }

    qb.orderBy(sortColumn, sortOrder);// ORDER BY listing.price ASC
    if (sortColumn !== SORT_COLUMNS.id){// ila kano 3ndhom same price... zid rttbhom 3la hsab id desc
      qb.addOrderBy(SORT_COLUMNS.id, 'DESC');// ORDER BY bedromsASC, id DESC
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      data:items.map((l) => this.toResponse(l)),
      meta: {total, page, limit, totalPage: Math.ceil(total / limit)},
    };
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
