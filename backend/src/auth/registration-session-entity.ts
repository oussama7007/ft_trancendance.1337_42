import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RegistrationSession
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  token: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  dateOfBirth: string;

  @Column()
  gender: string;



  @Column({ nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  verificationCode?: string | null;

  @Column({ type: 'integer', default: 0 })
  verificationAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiresAt?: Date | null;

  @Column({ default: false })
  isVerified: boolean;
}