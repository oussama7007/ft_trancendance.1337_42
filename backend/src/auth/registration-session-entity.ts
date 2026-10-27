import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RegistrationSession
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  dateOfBirth: string;

  @Column()
  gender: string;

  @Column({ nullable: true })
  cin?: string;

  @Column({ nullable: true })
  contact?: string;

  @Column({ nullable: true })
  verificationCode?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiresAt?: Date;

  @Column({ default: false })
  isVerified: boolean;
}