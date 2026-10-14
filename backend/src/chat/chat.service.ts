import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createConversation(
    participantOneId: number,
    participantTwoId: number,
  ): Promise<Conversation> {
    this.validateId(participantOneId, 'participantOneId');
    this.validateId(participantTwoId, 'participantTwoId');

    if (participantOneId === participantTwoId) {
      throw new BadRequestException(
        'A conversation requires two different users',
      );
    }

    const conversation = this.conversationRepository.create({
      participantOneId,
      participantTwoId,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversations(userId: number): Promise<Conversation[]> {
    this.validateId(userId, 'userId');

    return this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.participantOneId = :userId', { userId })
      .orWhere('conversation.participantTwoId = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();
  }

  async getMessages(
    conversationId: number,
    userId: number,
  ): Promise<Message[]> {
    this.validateId(conversationId, 'conversationId');
    this.validateId(userId, 'userId');

    await this.findConversationForUser(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
  ): Promise<Message> {
    this.validateId(conversationId, 'conversationId');
    this.validateId(senderId, 'senderId');

    if (typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    await this.findConversationForUser(conversationId, senderId);

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      content: content.trim(),
    });

    const savedMessage = await this.messageRepository.save(message);

    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    return savedMessage;
  }

  private async findConversationForUser(
    conversationId: number,
    userId: number,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: [
        { id: conversationId, participantOneId: userId },
        { id: conversationId, participantTwoId: userId },
      ],
    });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found for this user',
      );
    }

    return conversation;
  }

  private validateId(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
  }
}
