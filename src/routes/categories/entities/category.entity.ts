import slugify from 'slugify';
import { ABaseEntity } from 'src/classes/abstracts/ABaseEntity.abstract';
import { ICategory } from 'src/interfaces/model/category.model';
import { UserEntity } from 'src/routes/users/entities/user.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('category')
export class CategoryEntity extends ABaseEntity implements ICategory {
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @ManyToOne(() => CategoryEntity, (category) => category.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: CategoryEntity;

  @OneToMany(() => CategoryEntity, (category) => category.parent, { onDelete: 'CASCADE', nullable: true })
  children: CategoryEntity[];

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  updatedBy: UserEntity;

  @BeforeInsert()
  @BeforeUpdate()
  async createSlug() {
    this.slug = slugify(this.name || '', {
      replacement: '-',
      remove: undefined,
      lower: false,
      strict: false,
      locale: 'vi',
      trim: true,
    });
  }
}
