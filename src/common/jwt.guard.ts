import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtCookieAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();

    request.user = user;

    return user;
  }

  getRequest(context: ExecutionContext): Request {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const token = request.cookies['accessToken'] || null;

    if (!token) {
      throw new UnauthorizedException('No JWT token found in cookies');
    }

    return request;
  }
}
