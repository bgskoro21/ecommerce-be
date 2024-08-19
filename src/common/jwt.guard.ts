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
    return user;
  }

  getRequest(context: ExecutionContext): Request {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    // Extract the JWT from the cookies
    const token = request.cookies['accessToken'] || null;

    if (!token) {
      throw new UnauthorizedException('No JWT token found in cookies');
    }

    // Set the token in the authorization header for the default JwtStrategy
    request.headers.authorization = `Bearer ${token}`;

    return request;
  }
}
