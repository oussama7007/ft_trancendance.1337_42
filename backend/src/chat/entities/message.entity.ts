import type { Relation } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Conversation } from './conversation.entity.js';

export type MessageType = 'text' | 'image' | 'audio' | 'file';

@Entity('messages')
@Index('IDX_messages_conversation_id_id', ['conversationId', 'id'])
@Check('CHK_messages_type', `"type" IN ('text', 'image', 'audio', 'file')`)
@Check('CHK_messages_content_length', `char_length("content") <= 4000`)
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'conversation_id', type: 'integer' })
  conversationId!: number;

  @Column({ name: 'sender_id', type: 'integer' })
  senderId!: number;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'varchar', length: 10, default: 'text' })
  type!: MessageType;

  @Column({ name: 'attachment_path', type: 'varchar', length: 255, nullable: true, select: false })
  attachmentPath!: string | null;

  @Column({ name: 'attachment_name', type: 'varchar', length: 255, nullable: true })
  attachmentName!: string | null;

  @Column({ name: 'attachment_mime', type: 'varchar', length: 120, nullable: true })
  attachmentMime!: string | null;

  @Column({ name: 'attachment_size', type: 'integer', nullable: true })
  attachmentSize!: number | null;

  @Column({ name: 'audio_duration', type: 'integer', nullable: true })
  audioDuration!: number | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(
    () => Conversation,
    (conversation) => conversation.messages,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Relation<Conversation>;
}
