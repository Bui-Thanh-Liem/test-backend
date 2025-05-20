import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ICategory } from 'src/interfaces/model/category.model';

const FULLNAME_MIN = 2;
const FULLNAME_MAX = 50;

export class CreateCategoryDto implements Partial<ICategory> {
  @ApiProperty({ default: 'Đồng Hồ' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(FULLNAME_MIN, {
    message: `Name minimum ${FULLNAME_MIN} characters`,
  })
  @MaxLength(FULLNAME_MAX, {
    message: `Name maximum ${FULLNAME_MAX} characters`,
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  parent?: string;
}
