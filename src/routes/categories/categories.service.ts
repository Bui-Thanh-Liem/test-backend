import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private userService: UsersService,
  ) {}

  async create(payload: CreateCategoryDto, userActiveId: string): Promise<CategoryEntity> {
    const { name, description, children, parent } = payload;

    // creator
    const creator = await this.userService.validateUser(userActiveId);

    // Check exist fullname
    const isExistFullname = await this.categoryRepository.existsBy({ name });
    if (isExistFullname) {
      throw new ConflictException('Name đã tồn tại');
    }

    //
    if (parent) {
    }

    //
    if (parent) {
    }

    const dataCreate = this.categoryRepository.create({
      name,
      description,
      createdBy: creator,
    });
    return await this.userRepository.save(dataCreate);
  }

  findAll() {
    return `This action returns all categories`;
  }

  findOneById(id: string) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
