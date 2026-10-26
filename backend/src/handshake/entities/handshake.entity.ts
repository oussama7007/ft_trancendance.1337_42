import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

// A handshake between one listing and one client. The two yes answers are
// stored separately and the status is derived from them (handshake.utils.ts),
// so the data can never contradict itself.
//
// TODO(fk): listing_id, owner_id and client_id are plain integers because the
// listings and users tables are not on this branch yet. Turn them into real
// foreign keys, in a new migration, once those tables exist.
@Entity('handshakes')
// One handshake per listing and client. The database enforces it, which is also
// what makes creating the row safe when two requests arrive together.
@Unique('unique_handshake', ['listingId', 'clientId'])
export class Handshake {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'listing_id', type: 'integer' })
  listingId!: number;

  // Copied from the listing when the row is created, so we know which of the
  // two people is the owner.
  @Column({ name: 'owner_id', type: 'integer' })
  ownerId!: number;

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number;

  @Column({ name: 'owner_approved', type: 'boolean', default: false })
  ownerApproved!: boolean;

  @Column({ name: 'client_approved', type: 'boolean', default: false })
  clientApproved!: boolean;

  // The moment the second yes arrived. Empty until then.
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
