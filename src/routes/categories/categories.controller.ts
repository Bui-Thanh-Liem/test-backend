import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseSuccess } from 'src/classes';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { ActiveUser } from 'src/decorators/activeUser.decorator';
import { IPayloadToken } from 'src/interfaces/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() payload: CreateCategoryDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.categoriesService.create(payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Get()
  async findAll(@Query() queries: AQueries, @ActiveUser() activeUser: IPayloadToken) {
    const results = await this.categoriesService.findAll(queries, activeUser?.userId);
    return new ResponseSuccess('Success', results);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.categoriesService.findOneById(id);
    return new ResponseSuccess('Success', result);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateCategoryDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.categoriesService.update(id, payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.categoriesService.remove(id);
    return new ResponseSuccess('Success', result);
  }
}
