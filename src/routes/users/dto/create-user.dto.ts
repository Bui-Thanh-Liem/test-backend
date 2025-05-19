import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/decorators/match.decorator';
import { IUser } from 'src/interfaces/model/user.model';

const FULLNAME_MIN = 2;
const FULLNAME_MAX = 24;

export class CreateUserDto implements Partial<IUser> {
  @ApiProperty({ default: 'LiemDev' })
  @IsNotEmpty({ message: 'Fullname is required' })
  @IsString()
  @MinLength(FULLNAME_MIN, {
    message: `Fullname minimum ${FULLNAME_MIN} characters`,
  })
  @MaxLength(FULLNAME_MAX, {
    message: `Fullname maximum ${FULLNAME_MAX} characters`,
  })
  fullName: string;

  @ApiProperty({ default: 'buithanhliem5073@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'Admin123@' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ default: 'Admin123@' })
  @Match('password', {
    message: 'Passwords do not match',
  })
  passwordConfirm?: string;
}
