import type { Relation } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import { Message } from './message.entity.js';

@Entity('conversations')
@Check('CHK_conversation_different_participants', `"participant_one_id" <> "participant_two_id"`)
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'participant_one_id', type: 'integer' })
  participantOneId!: number;

  @Column({ name: 'participant_two_id', type: 'integer' })
  participantTwoId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Relation<Message[]>;
}
