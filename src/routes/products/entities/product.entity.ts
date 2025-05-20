import { Expose } from 'class-transformer';
import slugify from 'slugify';
import { ABaseEntity } from 'src/classes/abstracts/ABaseEntity.abstract';
import { IProduct } from 'src/interfaces/model/product.model';
import { CategoryEntity } from 'src/routes/categories/entities/category.entity';
import { UserEntity } from 'src/routes/users/entities/user.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

@Entity('product')
export class ProductEntity extends ABaseEntity implements IProduct {
  @Column({ type: 'varchar', length: 100, unique: true })
  name_vi: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name_en: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug_vi: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug_en: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: CategoryEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  updatedBy: UserEntity;

  @ManyToMany(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'product_likes',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  likes: UserEntity[];

  @Expose()
  get likesCount(): number {
    return this.likes?.length || 0;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async createSlug() {
    this.slug_vi = slugify(this.name_vi || '', {
      replacement: '-',
      remove: undefined,
      lower: false,
      strict: false,
      locale: 'vi',
      trim: true,
    });
  }

  @BeforeInsert()
  @BeforeUpdate()
  async createSlugEN() {
    this.slug_en = slugify(this.name_en || '', {
      replacement: '-',
      remove: undefined,
      lower: false,
      strict: false,
      locale: 'vi',
      trim: true,
    });
  }
}
