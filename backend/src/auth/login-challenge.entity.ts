import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('login_challenge')
export class LoginChallenge {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        length: 64,
        unique: true,
    })
    tokenHash: string;

    @Column({
        type: 'integer',
    })
    userId: number;

    @Column({
        type: 'timestamptz',
    })
    expiresAt: Date;
}