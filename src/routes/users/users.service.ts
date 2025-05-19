import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async create(
    payload: CreateUserDto,
    userActiveId: string,
  ): Promise<UserEntity> {
    const { email, fullName } = payload;

    // creator
    const creator = await this.userRepository.findOneBy({
      id: userActiveId,
    });
    if (!creator) {
      throw new BadRequestException(
        'Something went wrong, please login again.',
      );
    }

    // Check exist fullname
    const findItemByFullname = await this.userRepository.findOneBy({
      fullName,
    });
    if (findItemByFullname) {
      throw new ConflictException('Fullname đã tồn tại');
    }

    // Check exist email
    const findItemByEmail = await this.userRepository.findOneBy({
      email,
    });
    if (findItemByEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    delete payload.passwordConfirm;
    const dataCreate = this.userRepository.create({
      ...payload,
      createdBy: creator,
    });
    return await this.userRepository.save(dataCreate);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
