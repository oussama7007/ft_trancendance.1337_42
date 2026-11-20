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

  // Finds the listing a chat is about, so the chat knows which handshake to show
  // A chat starts when an owner accepts an interest request, and that request
  // remembers the listing, the tenant and the conversation
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

  // Returns the handshake between a listing and a client, as `userId` sees it.
  // It only reads: if nobody has clicked yet there is no row, and the status
  // is simply 'none'.
  async getHandshake(listingId: number, clientId: number, userId: number): Promise<HandshakeResponseDto>
  {
    const ownerId = await this.getListingOwnerId(listingId);
    this.assertParticipant(userId, ownerId, clientId);

    const handshake = await this.handshakeRepository.findOneBy({ listingId, clientId });
    return toResponse(handshake, userId);
  }

  // Records the yes of `userId`. The first yes makes the handshake 'pending',
  // the second one makes it 'confirmed', and clicking twice changes nothing.
  //
  // The work is split into small SQL statements on purpose. Reading the row,
  // changing it and saving it crashes when the owner and the client click at
  // the same moment (both try to create it). This version does not.
  async approveHandshake( listingId: number, clientId: number, userId: number ): Promise<HandshakeResponseDto>
  {
    const ownerId = await this.getListingOwnerId(listingId);
    this.assertParticipant(userId, ownerId, clientId);

    // First click: create the row. If it already exists, do nothing.
    await this.handshakeRepository
      .createQueryBuilder()
      .insert()
      .values({ listingId, clientId, ownerId })
      .orIgnore()
      .execute();

    // Set the yes of whoever clicked. The guard above guarantees that anyone
    // who is not the owner is the client.
    const yes = userId === ownerId ? { ownerApproved: true } : { clientApproved: true };
    await this.handshakeRepository.update({ listingId, clientId }, yes);

    // Once both have said yes, store the moment, and only the first time.
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

  // Stops the request when the caller has no business in this handshake:
  // nobody can shake hands with themselves, and only the owner and the client
  // may see or change it.
  private assertParticipant(userId: number, ownerId: number, clientId: number): void
  {
    if (ownerId === clientId)
      throw new BadRequestException('The owner and the client are the same person');
    if (userId !== ownerId && userId !== clientId) {
      throw new ForbiddenException('You are not part of this handshake');
    }
  }

  // Returns the id of the user who owns the listing, or 404 if it does not exist
  private async getListingOwnerId(listingId: number): Promise<number>
  {
    const listing = await this.listingRepository.findOneBy({ id: listingId });
    if (!listing)
      throw new NotFoundException('Listing not found');
    return listing.ownerId;
  }
}
