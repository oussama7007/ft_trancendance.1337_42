import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../auth/user.entity.js';

@Entity()
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId', foreignKeyConstraintName: 'FK_listing_owner' })
  owner?: User;

  @Column()
  cityAr: string;

  @Column()
  cityFr: string;

  @Column()
  cityEn: string;

  @Column()
  titleAr: string;

  @Column()
  titleFr: string;

  @Column()
  titleEn: string;

  @Column({ type: 'text' })
  descriptionAr: string;

  @Column({ type: 'text' })
  descriptionFr: string;

  @Column({ type: 'text' })
  descriptionEn: string;

  @Column()
  district: string;

  @Column()
  districtEnFr: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int' })
  bedrooms: number;

  @Column({ default: false })
  hasWifi: boolean;

  @Column()
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ nullable: true })
  video?: string;

  @Column()
  ownerName: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column()
  type: string; // 'apartment' | 'house' | 'studio' | 'riad' | 'villa'
}
