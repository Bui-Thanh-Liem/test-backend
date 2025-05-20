import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { getPaginationParams } from 'src/utils/getPaginationParams ';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';
import { TTranslations } from 'src/types/translations.type';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private userService: UsersService,
  ) {}

  async create(payload: CreateCategoryDto, userActiveId: string): Promise<CategoryEntity> {
    const { name_vi, name_en, description_vi, description_en, parent } = payload;

    //
    const creator = await this.userService.validateUser(userActiveId);

    // exists
    const isExistName = await this.categoryRepository.existsBy({ name_vi, name_en });
    if (isExistName) {
      throw new ConflictException('Name already exists');
    }

    //
    const newCategory = this.categoryRepository.create({
      name_vi,
      name_en,
      description_vi,
      description_en,
      createdBy: creator,
    });

    //
    if (parent) {
      const parentCategory = await this.findOneById(parent);
      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${parent} not found`);
      }
      newCategory.parent = parentCategory;
    }

    return await this.categoryRepository.save(newCategory);
  }

  async findAll(
    lang: TTranslations,
    queries: AQueries,
    userActiveId: string,
  ): Promise<IResponseFindAll<CategoryEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    //
    await this.userService.validateUser(userActiveId);

    //
    queryBuilder.select([
      'category.id',
      `category.name_${lang} AS name`,
      `category.description_${lang} AS description`,
      `category.slug_${lang} AS slug`,
      'category.createdAt',
      'category.updatedAt',
    ]);

    queryBuilder.leftJoinAndSelect('category.createdBy', 'createdBy');
    queryBuilder.leftJoinAndSelect('category.updatedBy', 'updatedBy');
    queryBuilder.leftJoinAndSelect('category.children', 'children');
    queryBuilder.leftJoinAndSelect('category.parent', 'parent');

    if (q) {
      queryBuilder.where(`category.name_${lang} LIKE :q`, {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }

    queryBuilder.orderBy('category.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    return { items, totalItems };
  }

  async findOneById(id: string, lang: TTranslations = 'vi'): Promise<any> {
    const qb = this.categoryRepository.createQueryBuilder('category');

    qb.select([
      'category.id',
      `category.name_${lang} AS name`,
      `category.description_${lang} AS description`,
      `category.slug_${lang} AS slug`,
      'category.createdAt',
      'category.updatedAt',
    ]);

    qb.leftJoinAndSelect('category.createdBy', 'createdBy');
    qb.leftJoinAndSelect('category.updatedBy', 'updatedBy');
    qb.leftJoinAndSelect('category.parent', 'parent');
    qb.leftJoinAndSelect('category.children', 'children');

    qb.where('category.id = :id', { id });

    const categoryRaw = await qb.getRawOne();

    if (!categoryRaw) {
      throw new NotFoundException('Category not found');
    }

    // Bạn có thể map lại kết quả nếu muốn
    return categoryRaw;
  }

  async update(id: string, payload: UpdateCategoryDto, userActiveId: string) {
    const { name_vi, name_en, description_vi, description_en, parent } = payload;

    //
    const editor = await this.userService.validateUser(userActiveId);

    // exist
    const category = await this.categoryRepository.findOne({ where: { id }, relations: ['parent', 'children'] });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    //
    if (name_vi && category.name_vi !== name_vi) {
      const existsVi = await this.categoryRepository.exist({ where: { name_vi } });
      if (existsVi) throw new ConflictException('Vietnamese name already exists');
    }

    if (name_en && category.name_en !== name_en) {
      const existsEn = await this.categoryRepository.exist({ where: { name_en } });
      if (existsEn) throw new ConflictException('English name already exists');
    }

    category.name_vi = name_vi ?? category.name_vi;
    category.name_en = name_en ?? category.name_en;
    category.description_vi = description_vi ?? category.description_vi;
    category.description_en = description_en ?? category.description_en;
    category.updatedBy = editor;

    //
    if (parent !== undefined) {
      if (parent === null) {
        category.parent = null;
      } else {
        const parentCategory = await this.categoryRepository.findOneBy({ id: parent });
        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        //
        if (parent === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }

        category.parent = parentCategory;
      }
    }

    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<boolean> {
    //
    const exists = await this.categoryRepository.exists({ where: { id } });
    if (!exists) {
      throw new NotFoundException('User not found');
    }

    //
    try {
      await this.categoryRepository.delete(id);
      return true;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
