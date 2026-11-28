import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('totp_login_challenge')
export class TotpLoginChallenge {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer' })
    userId: number;

    @Column({ type: 'varchar', length: 64, unique: true })
    tokenHash: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'integer', default: 0 })
    attempts: number;
}
