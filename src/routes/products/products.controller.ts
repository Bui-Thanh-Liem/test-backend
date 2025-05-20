import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseSuccess } from 'src/classes';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { ActiveUser } from 'src/decorators/activeUser.decorator';
import { IPayloadToken } from 'src/interfaces/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { TTranslations } from 'src/types/translations.type';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() payload: CreateProductDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.productsService.create(payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Get('/search')
  async search(
    @Query() queries: AQueries,
    @Headers('accept-language') langHeader: TTranslations,
    @ActiveUser() activeUser: IPayloadToken,
  ) {
    const results = await this.productsService.findAll(langHeader, queries, activeUser?.userId);
    return new ResponseSuccess('Success', results);
  }

  @Get()
  async findAll(
    @Query() queries: AQueries,
    @Headers('accept-language') langHeader: TTranslations,
    @ActiveUser() activeUser: IPayloadToken,
  ) {
    const results = await this.productsService.findAll(langHeader, queries, activeUser?.userId);
    return new ResponseSuccess('Success', results);
  }

  @Post(':id/like')
  async toggleLike(@Param('id') productId: string, @ActiveUser() activeUser: IPayloadToken) {
    const { action, product } = await this.productsService.toggleLike(productId, activeUser.userId);

    return new ResponseSuccess(`Product ${action} successfully`, {
      productId: product.id,
      likesCount: product.likes?.length || 0,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('accept-language') langHeader: TTranslations) {
    const result = await this.productsService.findOneById(id, langHeader);
    return new ResponseSuccess('Success', result);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateProductDto, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.productsService.update(id, payload, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @ActiveUser() activeUser: IPayloadToken) {
    const result = await this.productsService.remove(id, activeUser?.userId);
    return new ResponseSuccess('Success', result);
  }
}
