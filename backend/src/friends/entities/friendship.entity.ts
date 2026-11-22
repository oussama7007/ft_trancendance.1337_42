import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/user.entity.js';

export type FriendshipRowStatus = 'pending' | 'accepted';

@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  // the one who sent the request
  @Column({ name: 'requester_id', type: 'integer' })
  requesterId!: number;

  // the one who got the request
  @Column({ name: 'addressee_id', type: 'integer' })
  addresseeId!: number;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status!: FriendshipRowStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addressee_id' })
  addressee!: User;
}
