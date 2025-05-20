import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { IProduct } from 'src/interfaces/model/product.model';

export class CreateProductDto implements Partial<IProduct> {
  @ApiProperty({ default: 'IPhone 14 Pro Max' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name_vi: string;

  @ApiProperty({ default: 'IPhone 14 Pro Max' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name_en: string;

  @ApiProperty({ default: 25000000 })
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  category?: string;

  @IsOptional()
  @IsUUID('4', { message: 'SubCategory ID must be a valid UUID' })
  subCategory?: string;
}
