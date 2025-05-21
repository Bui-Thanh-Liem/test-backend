import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { TTranslations } from 'src/types/translations.type';
import { getPaginationParams } from 'src/utils/getPaginationParams';
import { mapKeys } from 'src/utils/mapKeys.util';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private userService: UsersService,
  ) {}

  private buildCategoryQueryBuilder(
    name: string,
    lang: TTranslations,
  ): { queryBuilder: SelectQueryBuilder<CategoryEntity>; fields: { name: string; description: string; slug: string } } {
    const queryBuilder = this.categoryRepository.createQueryBuilder(name);

    //
    const fields = {
      name: `name_${lang}`,
      description: `description_${lang}`,
      slug: `slug_${lang}`,
    };

    queryBuilder
      .select([
        'category.id',
        `category.${fields.name}`,
        `category.${fields.description}`,
        `category.${fields.slug}`,
        'category.createdAt',
        'category.updatedAt',
      ])
      .leftJoinAndSelect('category.createdBy', 'createdBy')
      .leftJoinAndSelect('category.updatedBy', 'updatedBy');

    queryBuilder
      .leftJoin('category.children', 'children')
      .addSelect(['children.id', `children.name_${lang}`, `children.description_${lang}`, `children.slug_${lang}`]);

    queryBuilder
      .leftJoin('category.parent', 'parent')
      .addSelect(['parent.id', `parent.name_${lang}`, `parent.description_${lang}`, `parent.slug_${lang}`]);

    return { queryBuilder, fields };
  }

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
    lang: TTranslations = 'vi',
    queries: AQueries,
    userActiveId: string,
  ): Promise<IResponseFindAll<CategoryEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);

    //
    await this.userService.validateUser(userActiveId);

    //
    const { queryBuilder, fields } = this.buildCategoryQueryBuilder('category', lang);

    //
    if (q) {
      queryBuilder.where(`category.name_${lang} LIKE :q`, {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }

    //
    queryBuilder.orderBy('category.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    const keyPairs: Array<[string, string]> = [
      [fields.name, 'name'],
      [fields.description, 'description'],
      [fields.slug, 'slug'],
    ];
    const _items = mapKeys({
      items: items,
      keyPairs: keyPairs,
      relations: [
        {
          key: 'parent',
          keyPairs: keyPairs,
        },
        {
          key: 'children',
          keyPairs: keyPairs,
        },
      ],
    }) as CategoryEntity[];

    //
    return { items: _items, totalItems };
  }

  async findOneById(id: string, lang: TTranslations = 'vi'): Promise<CategoryEntity> {
    const { queryBuilder, fields } = this.buildCategoryQueryBuilder('category', lang);

    //
    queryBuilder.where('category.id = :id', { id });

    //
    const category = await queryBuilder.getOne();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    //
    const keyPairs: Array<[string, string]> = [
      [fields.name, 'name'],
      [fields.description, 'description'],
      [fields.slug, 'slug'],
    ];
    const _item = mapKeys({
      items: category,
      keyPairs: keyPairs,
      relations: [
        {
          key: 'parent',
          keyPairs: keyPairs,
        },
        {
          key: 'children',
          keyPairs: keyPairs,
        },
      ],
    }) as CategoryEntity;

    //
    return _item;
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
      throw new NotFoundException('Category not found');
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
