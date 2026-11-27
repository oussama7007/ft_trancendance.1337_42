import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('totp_enrollment')
export class TotpEnrollment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'integer',
    })
    userId: number;

    @Column({ type: 'text', nullable: true })
    secretEncrypted: string | null;

    @Column({ type: 'varchar', length: 64, unique: true })
    tokenHash: string;

    @Column({
        type: 'timestamptz',
    })
    expiresAt: Date;

    @Column({
        type: 'integer',
        default: 0,
    })
    attempts: number;
}
