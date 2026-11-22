import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Listing } from '../../listings/listing.entity.js';

@Entity('handshakes')
@Unique('unique_handshake', ['listingId', 'clientId'])
export class Handshake {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'listing_id', type: 'integer' })
  listingId!: number;

  @Column({ name: 'owner_id', type: 'integer' })
  ownerId!: number;

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number;

  @Column({ name: 'owner_approved', type: 'boolean', default: false })
  ownerApproved!: boolean;

  @Column({ name: 'client_approved', type: 'boolean', default: false })
  clientApproved!: boolean;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
