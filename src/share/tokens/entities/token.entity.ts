import { ABaseEntity } from 'src/classes/abstracts/ABaseEntity.abstract';
import { UserEntity } from 'src/routes/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('token')
export class TokenEntity extends ABaseEntity {
  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  refreshToken: string;

  @ManyToOne(() => UserEntity, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Omit<UserEntity, 'password'>;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date;

  @Column({ type: 'varchar', nullable: true })
  deviceInfo: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  updatedBy: UserEntity;

  isExpired(): boolean {
    if (!this.expiresAt) return true;
    return new Date() > this.expiresAt;
  }

  isRefreshTokenExpired(): boolean {
    if (!this.refreshTokenExpiresAt) return true;
    return new Date() > this.refreshTokenExpiresAt;
  }
}
