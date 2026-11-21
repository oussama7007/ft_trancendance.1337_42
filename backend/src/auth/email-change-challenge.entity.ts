import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('email_change_challenge')
export class EmailChangeChallenge {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', unique: true })
    userId: number;

    @Column()
    pendingEmail: string;

    @Column({ length: 64 })
    codeHash: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

        @Column({
        type: 'integer',
        default: 0,
    })
    attempts: number;
}