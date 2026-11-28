import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('password_reset_token')
export class PasswordResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', unique: true })
    userId: number;

    @Column({ length: 128 })
    tokenHash: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ type: 'boolean', default: false })
    used: boolean;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'varchar', length: 128, nullable: true })
    grantHash: string | null;

    @Column({ type: 'integer', default: 0 })
    attempts: number;
}
