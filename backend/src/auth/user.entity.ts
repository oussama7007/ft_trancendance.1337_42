import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
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

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;


    
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  
  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  
  @Column({ type: 'varchar', nullable: true })
  linkedin: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', nullable: true })
  facebook: string | null;

  
  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true })
  googleEmail: string | null;


    @Column({ type: 'boolean', default: false })
    totpEnabled: boolean;

    @Column({ type: 'text', nullable: true })
    totpSecretEncrypted: string | null;

    @Column({ type: 'varchar', nullable: true })
    totpLastUsedStep: string | null;
}