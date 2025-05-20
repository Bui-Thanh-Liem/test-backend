import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { getPaginationParams } from 'src/utils/getPaginationParams ';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    this.initialAdmin();
  }

  async create(payload: CreateUserDto, userActiveId: string): Promise<UserEntity> {
    const { email, fullName } = payload;

    // creator
    const creator = await this.validateUser(userActiveId);

    // Check exist fullname
    const isExistFullname = await this.userRepository.existsBy({ fullName });
    if (isExistFullname) {
      throw new ConflictException('Fullname already exists');
    }

    // Check exist email
    const isExistEmail = await this.userRepository.existsBy({
      email,
    });
    if (isExistEmail) {
      throw new ConflictException('Email already exists');
    }

    delete payload.passwordConfirm;
    const dataCreate = this.userRepository.create({
      ...payload,
      createdBy: creator,
    });
    return await this.userRepository.save(dataCreate);
  }

  async findAll(queries: AQueries, userActiveId: string): Promise<IResponseFindAll<UserEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    //
    await this.validateUser(userActiveId);

    //
    queryBuilder.select(['user.id', 'user.fullName', 'user.email', 'user.createdAt', 'user.updatedAt']);
    queryBuilder.leftJoinAndSelect('user.createdBy', 'createdBy');
    queryBuilder.leftJoinAndSelect('user.updatedBy', 'updatedBy');
    if (q) {
      queryBuilder.where('(user.fullName LIKE :q OR user.email LIKE :q)', {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }
    queryBuilder.orderBy('user.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    return { items, totalItems };
  }

  async findOneById(id: string): Promise<UserEntity> {
    //
    const user = await this.userRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy'] });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ where: { email }, relations: ['createdBy', 'updatedBy'] });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, payload: UpdateUserDto, userActiveId: string): Promise<UserEntity> {
    const { email, fullName } = payload;

    //
    const editor = await this.validateUser(userActiveId);

    // exist
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //
    if (email) {
      const isExistEmail = await this.userRepository.existsBy({
        email,
      });
      if (isExistEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    //
    if (fullName) {
      const isExistFullname = await this.userRepository.existsBy({
        fullName,
      });
      if (isExistFullname) {
        throw new ConflictException('Fullname already exists');
      }
    }

    //
    const updatedUser = this.userRepository.create({
      ...user,
      ...payload,
      updatedBy: editor,
    });

    const savedUser = await this.userRepository.save(updatedUser);

    return savedUser;
  }

  async remove(id: string, userActiveId: string): Promise<boolean> {
    //
    const exists = await this.userRepository.exists({ where: { id } });
    if (!exists) {
      throw new NotFoundException('User not found');
    }

    //
    try {
      await this.userRepository.delete(id);
      return true;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async validateUser(id: string): Promise<UserEntity> {
    const user = await this.userRepository.createQueryBuilder('user').where('user.id = :id', { id }).getOne();

    if (!user) {
      throw new UnauthorizedException('Something went wrong, please login again.');
    }
    return user;
  }

  async initialAdmin() {
    const admin_fullname = process.env.ROOT_FULLNAME || 'liemdev';
    const admin_email = process.env.ROOT_EMAIL || 'buithanhliem5073@gmail.com';
    const admin_password = process.env.ROOT_PASSWORD || 'Admin123@';

    const findAdmin = await this.userRepository.findOneBy({
      fullName: admin_fullname,
      email: admin_email,
    });

    if (findAdmin) return;

    const dataAdmin: Partial<UserEntity> = {
      isAdmin: true,
      email: admin_email,
      fullName: admin_fullname,
      password: admin_password,
    };

    const createData = this.userRepository.create(dataAdmin);
    await this.userRepository.save(createData);
  }
}
