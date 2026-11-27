import
{
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { InterestRequest, InterestRequestStatus } from '../chat/entities/interest-request.entity.js';
import { Listing } from '../listings/listing.entity.js';
import { ChatHandshakeDto, HandshakeResponseDto } from './dto/handshake-response.dto.js';
import { Handshake } from './entities/handshake.entity.js';
import { toResponse } from './handshake.utils.js';

@Injectable()
export class HandshakeService {
  constructor(
    @InjectRepository(Handshake) private readonly handshakeRepository: Repository<Handshake>,
    @InjectRepository(Listing) private readonly listingRepository: Repository<Listing>,
    @InjectRepository(InterestRequest) private readonly interestRequestRepository: Repository<InterestRequest>,
  ) {}

  // finds the listing of a chat from its accepted interest request
  async getForConversation(conversationId: number, userId: number): Promise<ChatHandshakeDto>
  {
    const request = await this.interestRequestRepository.findOne({
      where: [
        { conversationId, status: InterestRequestStatus.ACCEPTED, tenantId: userId },
        { conversationId, status: InterestRequestStatus.ACCEPTED, ownerId: userId },
      ],
      order: { updatedAt: 'DESC' },
    });
    if (!request)
      return { listing: null };

    const listing = await this.listingRepository.findOneBy({ id: request.listingId });
    if (!listing)
      return { listing: null };

    return {
      listing: {
        id: listing.id,
        clientId: request.tenantId,
        title: { ar: listing.titleAr, fr: listing.titleFr, en: listing.titleEn },
      },
    };
  }

  // gets the handshake between a listing and a client
  async getHandshake(listingId: number, clientId: number, userId: number): Promise<HandshakeResponseDto>
  {
    const ownerId = await this.getListingOwnerId(listingId);
    this.assertParticipant(userId, ownerId, clientId);

    const handshake = await this.handshakeRepository.findOneBy({ listingId, clientId });
    return toResponse(handshake, userId);
  }

  // saves the yes of the user and confirms when both said yes
  async approveHandshake( listingId: number, clientId: number, userId: number ): Promise<HandshakeResponseDto>
  {
    const ownerId = await this.getListingOwnerId(listingId);
    this.assertParticipant(userId, ownerId, clientId);

    await this.handshakeRepository
      .createQueryBuilder()
      .insert()
      .values({ listingId, clientId, ownerId })
      .orIgnore()
      .execute();

    const yes = userId === ownerId ? { ownerApproved: true } : { clientApproved: true };
    await this.handshakeRepository.update({ listingId, clientId }, yes);

    await this.handshakeRepository.update(
      {
        listingId,
        clientId,
        ownerApproved: true,
        clientApproved: true,
        confirmedAt: IsNull(),
      },
      { confirmedAt: new Date() },
    );

    const handshake = await this.handshakeRepository.findOneBy({ listingId, clientId });
    return toResponse(handshake, userId);
  }

  // only the owner and the client can use it
  private assertParticipant(userId: number, ownerId: number, clientId: number): void
  {
    if (ownerId === clientId)
      throw new BadRequestException('The owner and the client are the same person');
    if (userId !== ownerId && userId !== clientId) {
      throw new ForbiddenException('You are not part of this handshake');
    }
  }

  // gets the owner of the listing
  private async getListingOwnerId(listingId: number): Promise<number>
  {
    const listing = await this.listingRepository.findOneBy({ id: listingId });
    if (!listing)
      throw new NotFoundException('Listing not found');
    return listing.ownerId;
  }
}
