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

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private userService: UsersService,
  ) {}

  async create(payload: CreateCategoryDto, userActiveId: string): Promise<CategoryEntity> {
    const { name, description, parent } = payload;

    //
    const creator = await this.userService.validateUser(userActiveId);

    // exists
    const isExistName = await this.categoryRepository.existsBy({ name });
    if (isExistName) {
      throw new ConflictException('Name already exists');
    }

    //
    const newCategory = this.categoryRepository.create({
      name,
      description,
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

  async findAll(queries: AQueries, userActiveId: string): Promise<IResponseFindAll<CategoryEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    //
    await this.userService.validateUser(userActiveId);

    //
    queryBuilder.select([
      'category.id',
      'category.name',
      'category.description',
      'category.slug',
      'category.createdAt',
      'category.updatedAt',
    ]);

    queryBuilder.leftJoinAndSelect('category.createdBy', 'createdBy');
    queryBuilder.leftJoinAndSelect('category.updatedBy', 'updatedBy');
    queryBuilder.leftJoinAndSelect('category.children', 'children');
    queryBuilder.leftJoinAndSelect('category.parent', 'parent');

    if (q) {
      queryBuilder.where('(category.name LIKE :q)', {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }

    queryBuilder.orderBy('category.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    return { items, totalItems };
  }

  async findOneById(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, payload: UpdateCategoryDto, userActiveId: string) {
    const { name, description, parent } = payload;

    //
    const editor = await this.userService.validateUser(userActiveId);

    // exist
    const category = await this.categoryRepository.findOne({ where: { id }, relations: ['parent', 'children'] });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    //
    if (name && category.name !== name) {
      const isExistName = await this.categoryRepository.existsBy({
        name,
      });
      if (isExistName) {
        throw new ConflictException('Name already exists');
      }
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
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
