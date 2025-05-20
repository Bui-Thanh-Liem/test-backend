import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { ABaseEntity } from 'src/classes/abstracts/ABaseEntity.abstract';
import { IUser } from 'src/interfaces/model/user.model';
import { TokenEntity } from 'src/share/tokens/entities/token.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('user')
export class UserEntity extends ABaseEntity implements IUser {
  @Column({ type: 'varchar', length: 50, unique: true })
  fullName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @Exclude()
  @OneToMany(() => TokenEntity, (token) => token.user, { cascade: true })
  tokens: TokenEntity[];

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) {
      throw new BadRequestException('Password cannot be empty');
    }
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(passwordConfirm: string): Promise<boolean> {
    return bcrypt.compare(passwordConfirm, this.password);
  }

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }
}
