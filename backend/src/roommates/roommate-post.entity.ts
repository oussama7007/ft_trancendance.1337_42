import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Listing } from '../listings/listing.entity.js';

@Entity()
export class RoommatePost {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn()
  listing: Listing;

  @Column({ type: 'int' })
  monthlyShare: number;

  @Column({ type: 'int' })
  peopleWanted: number;

  @Column({ default: 'any' })
  genderPreference: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
