import { Body, Controller, Delete, Get, Param, Patch, Post, Query, SerializeOptions } from '@nestjs/common';
import { ResponseSuccess } from 'src/classes';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { ActiveUser } from 'src/decorators/activeUser.decorator';
import { IPayloadToken } from 'src/interfaces/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SerializeOptions({ type: UserEntity })
  async create(@Body() payload: CreateUserDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.usersService.create(payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Get()
  async findAll(@Query() queries: AQueries, @ActiveUser() activeUser: IPayloadToken) {
    const results = await this.usersService.findAll(queries, activeUser?.userId);
    return new ResponseSuccess('Success', results);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOneById(id);
    return new ResponseSuccess('Success', result);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateUserDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.usersService.update(id, payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.usersService.remove(id, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }
}
