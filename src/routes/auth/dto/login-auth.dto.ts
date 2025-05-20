import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { IUser } from 'src/interfaces/model/user.model';

export class LoginAuthDto implements Partial<IUser> {
  @ApiProperty({ default: 'buithanhliem5073@gmail.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'Admin123@' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
