import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPayloadToken } from 'src/interfaces/common';

export const ActiveUser = createParamDecorator(
  (field: keyof IPayloadToken | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user: IPayloadToken | undefined = req.user;
    return field && user ? user[field] : user;
  },
);
