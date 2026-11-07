import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/listing.entity.js';
import { ListingsService } from '../listings/listings.service.js';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto.js';
import { FilterRoommatesDto } from './dto/filter-roommates.dto.js';
import { RoommatePost } from './roommate-post.entity.js';

@Injectable()
export class RoommatesService {
  constructor(
    @InjectRepository(RoommatePost)
    private readonly postRepository: Repository<RoommatePost>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    private readonly listingsService: ListingsService,
  ) {}

  async search(filters: FilterRoommatesDto) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.listing', 'listing');

    if (filters.city) {
      query.andWhere(
        '(listing.cityAr ILIKE :city OR listing.cityFr ILIKE :city OR listing.cityEn ILIKE :city)',
        { city: `%${filters.city.trim()}%` },
      );
    }

    if (filters.maxBudget !== undefined) {
      query.andWhere('post.monthlyShare <= :maxBudget', {
        maxBudget: filters.maxBudget,
      });
    }

    if (filters.gender) {
      query.andWhere("post.genderPreference IN ('any', :gender)", {
        gender: filters.gender,
      });
    }

    const posts = await query.orderBy('post.id', 'DESC').getMany();

    return posts.map((post) => this.toResponse(post));
  }

  async createPost(ownerId: number, data: CreateRoommatePostDto) {
    const listing = await this.listingRepository.findOneBy({
      id: data.listingId,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('This listing belongs to someone else');
    }

    const alreadyPosted = await this.postRepository.existsBy({
      listing: { id: listing.id },
    });

    if (alreadyPosted) {
      throw new ConflictException('This listing is already posted');
    }

    const post = await this.postRepository.save(
      this.postRepository.create({
        listing,
        monthlyShare: data.monthlyShare,
        peopleWanted: data.peopleWanted,
        genderPreference: data.genderPreference,
      }),
    );

    return this.toResponse(post);
  }

  private toResponse(post: RoommatePost) {
    return {
      id: post.id,
      monthlyShare: post.monthlyShare,
      peopleWanted: post.peopleWanted,
      genderPreference: post.genderPreference,
      listing: this.listingsService.toResponse(post.listing),
    };
  }
}
