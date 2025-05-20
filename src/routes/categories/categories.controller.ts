import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseSuccess } from 'src/classes';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { ActiveUser } from 'src/decorators/activeUser.decorator';
import { IPayloadToken } from 'src/interfaces/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TTranslations } from 'src/types/translations.type';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() payload: CreateCategoryDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.categoriesService.create(payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Get()
  async findAll(
    @Query() queries: AQueries,
    @Headers('accept-language') langHeader: TTranslations,
    @ActiveUser() activeUser: IPayloadToken,
  ) {
    console.log('langHeader::', langHeader);

    const results = await this.categoriesService.findAll(langHeader, queries, activeUser?.userId);
    return new ResponseSuccess('Success', results);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('accept-language') langHeader: TTranslations) {
    const result = await this.categoriesService.findOneById(id, langHeader);
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
