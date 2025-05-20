import { ABaseEntity } from 'src/classes/abstracts/ABaseEntity.abstract';
import { IProduct } from 'src/interfaces/model/product.model';
import { CategoryEntity } from 'src/routes/categories/entities/category.entity';
import { UserEntity } from 'src/routes/users/entities/user.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

@Entity('product')
export class ProductEntity extends ABaseEntity implements IProduct {
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToMany(() => CategoryEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'category_sub_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  subCategory: CategoryEntity[];

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  updatedBy: UserEntity;
}
