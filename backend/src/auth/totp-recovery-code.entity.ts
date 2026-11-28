import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('totp_recovery_codes')
export class TotpRecoveryCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'integer',
    })
    userId: number;

    @Column({ type: 'varchar', length: 128 })
    codeHash: string;

    @Column({
        type: 'boolean',
        default: false,
    })
    used: boolean;

    @Column({
        type: 'timestamptz',
        nullable: true,
    })
    usedAt: Date | null;
}
