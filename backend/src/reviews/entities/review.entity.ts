import
{
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { User } from '../../auth/user.entity.js';
import { Handshake } from '../../handshake/entities/handshake.entity.js';

export type ReviewRole = 'owner' | 'roommate';


@Entity('reviews')
@Unique('unique_review_per_handshake', ['handshakeId', 'reviewerId'])
export class Review
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({name: 'handshake_id', type: 'integer'})
    handshakeId!: number;

    @Column({name: 'reviewer_id', type: 'integer'})
    reviewerId!: number;

    @Column({name: 'reviewed_id', type: 'integer'})
    reviewedId: number;

    @Column({type: 'varchar', length: 10})
    role: ReviewRole;

    @Column({type: 'smallint'})
    rating: number;

    @Column({type: 'text'})
    comment: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @ManyToOne(() => Handshake)
    @JoinColumn({ name: 'handshake_id' })
    handshake: Handshake;
}
