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

// What is stored in the database. The status as the frontend sees it
// ('pending_sent', 'friends', ...) is computed in friends.utils.ts.
export type FriendshipRowStatus = 'pending' | 'accepted';

// The `friendships` table, described for TypeORM. The table itself, with its
// constraints (no self-friendship, one row per pair, cascade on user delete),
// is created by migrations/1792800000000-CreateFriendshipsTable.ts.
@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  // The user who clicked "Add friend".
  @Column({ name: 'requester_id', type: 'integer' })
  requesterId!: number;

  // The user who received the request. Only this user may accept or reject it.
  @Column({ name: 'addressee_id', type: 'integer' })
  addresseeId!: number;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status!: FriendshipRowStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // The two users themselves, loaded only when we ask for them
  // (relations: { requester: true }) to show names in the lists.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addressee_id' })
  addressee!: User;
}
