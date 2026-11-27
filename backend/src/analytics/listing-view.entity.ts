import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../auth/user.entity.js';
import { Listing } from '../listings/listing.entity.js';

// One row each time a signed-in user opens a listing's details
// (at most one per user, per listing, per 24h).
@Entity('listing_views')
@Index('IDX_listing_views_listing_created', ['listingId', 'createdAt'])
export class ListingView {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_listing_views' })
  id: number;

  @Column()
  listingId: number;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId', foreignKeyConstraintName: 'FK_listing_views_listing' })
  listing?: Listing;

  @Column()
  viewerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewerId', foreignKeyConstraintName: 'FK_listing_views_viewer' })
  viewer?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
