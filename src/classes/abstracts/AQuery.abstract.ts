import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IQueries } from 'src/interfaces/common/query.interface';

export abstract class AQueries implements IQueries {
  @Optional()
  @ApiProperty({ default: '20' })
  limit: string;

  @Optional()
  @ApiProperty({ default: '1' })
  page: string;

  @Optional()
  @ApiProperty({ type: 'string', required: false })
  q?: string;
}
