import { SetMetadata } from '@nestjs/common';
import { CONSTANT_DECORATOR } from 'src/constants/decorator.contant';

export const Public = () => SetMetadata(CONSTANT_DECORATOR.PUBLIC, true);
