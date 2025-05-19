import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  SerializeOptions,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseSuccess } from 'src/classes';
import { UserEntity } from './entities/user.entity';
import { IPayloadToken } from 'src/interfaces/common';
import { ActiveUser } from 'src/decorators/activeUser.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SerializeOptions({ type: UserEntity })
  async create(
    @Body() payload: CreateUserDto,
    @ActiveUser() activeUser: IPayloadToken,
  ) {
    const results = await this.usersService.create(payload, activeUser.userId);
    return new ResponseSuccess('Success', results);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
