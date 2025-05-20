import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { CacheService } from 'src/share/cache/cache.service';
import { generateCacheKeyAll, generateCacheKeyOne } from 'src/utils/generateCacheKey';
import { getPaginationParams } from 'src/utils/getPaginationParams ';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly ttl = 180;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
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
      throw new ConflictException('Fullname đã tồn tại');
    }

    // Check exist email
    const isExistEmail = await this.userRepository.existsBy({
      email,
    });
    if (isExistEmail) {
      throw new ConflictException('Email đã tồn tại');
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

    // cache (many cache/user)
    const cacheKey = generateCacheKeyAll('users', userActiveId, +page, +limit, q);
    const cachedData = await this.cacheService.getCache<IResponseFindAll<UserEntity>>(cacheKey);
    if (cachedData) return cachedData;

    //
    queryBuilder.select([
      'user.id',
      'user.fullName',
      'user.email',
      'user.createdBy',
      'user.updatedBy',
      'user.createdAt',
      'user.updatedAt',
    ]);
    queryBuilder.leftJoinAndSelect('user.createdBy', 'createdBy'); // Tải quan hệ createdBy
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
    try {
      await this.cacheService.setCache(cacheKey, { items, totalItems }, this.ttl);
      await this.cacheService.addToKeyList(`users:${userActiveId}`, cacheKey, this.ttl + 60);
      this.logger.debug('Caching');
    } catch (error) {
      throw new InternalServerErrorException('Could not cache, please try again later.');
    }

    //
    return { items, totalItems };
  }

  async findOneById(id: string, userActiveId: string): Promise<UserEntity> {
    //
    await this.validateUser(userActiveId);

    // Cache
    const cacheKey = generateCacheKeyOne('user', userActiveId, id);
    const cachedData = await this.cacheService.getCache<UserEntity>(cacheKey);
    if (cachedData) return cachedData;

    //
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.createdBy',
        'user.updatedBy',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //
    try {
      await this.cacheService.setCache(cacheKey, user, this.ttl);
    } catch (error) {
      throw new InternalServerErrorException('Could not cache, please try again later.');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    //
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.password',
        'user.createdBy',
        'user.updatedBy',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.email = :email', { email })
      .getOne();

    return user;
  }

  async update(id: string, payload: UpdateUserDto, userActiveId: string): Promise<UserEntity> {
    //
    const editor = await this.validateUser(userActiveId);

    //
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //
    if (payload.email) {
      const findItemByEmail = await this.userRepository.findOneBy({
        email: payload.email,
      });
      if (findItemByEmail && findItemByEmail.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    if (payload.fullName) {
      const findItemByFullname = await this.userRepository.findOneBy({
        fullName: payload.fullName,
      });
      if (findItemByFullname && findItemByFullname.id !== id) {
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

    //
    try {
      const cacheKey = generateCacheKeyOne('user', userActiveId, id);
      await this.cacheService.deleteCache(cacheKey);
      await this.cacheService.deleteCacheByPattern(`users:${userActiveId}`);
    } catch (error) {
      this.logger.log(error);
      throw new InternalServerErrorException('Unable to clear cache, please try again later.');
    }

    return savedUser;
  }

  async remove(id: string, userActiveId: string): Promise<boolean> {
    //
    await this.validateUser(userActiveId);

    //
    const isUser = await this.userRepository.exists({ where: { id } });
    if (!isUser) {
      throw new NotFoundException('User not found');
    }

    //
    await this.userRepository.delete(id);

    //
    try {
      const cacheKey = generateCacheKeyOne('user', userActiveId, id);
      await this.cacheService.deleteCache(cacheKey);
      await this.cacheService.deleteCacheByPattern(`users:${userActiveId}`);
      return true;
    } catch (error) {
      throw new InternalServerErrorException('Không thể xoá cache, vui lòng thử lại sau.');
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
