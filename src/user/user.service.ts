import {
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  LoginUserRequest,
  RegisterUserRequest,
  UserResponse,
} from 'src/model/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(request: RegisterUserRequest): Promise<UserResponse> {
    this.logger.debug(`Register new user ${JSON.stringify(request)}`);

    const registerRequest: RegisterUserRequest =
      this.validationService.validate(UserValidation.REGISTER, request);

    const totalUserWithSameEmail = await this.prismaService.user.count({
      where: {
        email: registerRequest.email,
      },
    });

    if (totalUserWithSameEmail != 0) {
      throw new HttpException('Email already exists!', 400);
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    return await this.prismaService.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: registerRequest,
      });

      if (user.role === 'STORE_OWNER') {
        await prisma.store.create({
          data: {
            userId: user.id,
            name: user.name,
          },
        });
      }

      await prisma.emailLog.create({
        data: {
          userId: user.id,
          email: user.email,
          type: 'EmailVerification',
          status: 'Pending',
        },
      });

      return {
        name: user.name,
        email: user.email,
      };
    });
  }

  async login(request: LoginUserRequest): Promise<UserResponse> {
    this.logger.debug(`Login request from ${request.email}`);

    const loginRequest: LoginUserRequest = this.validationService.validate(
      UserValidation.LOGIN,
      request,
    );

    const user = await this.prismaService.user.findFirst({
      where: {
        email: loginRequest.email,
      },
    });

    if (!user) {
      throw new HttpException('Email or password is wrong!', 401);
    }

    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpException('Email or password is wrong!', 401);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return tokens;
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Access Token valid selama 15 menit
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // Refresh Token valid selama 7 hari
    });

    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<UserResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { refreshToken: true },
      });

      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newTokens = await this.generateTokens(userId, payload.email);
      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token!');
    }
  }

  async logout(token: string): Promise<UserResponse> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;

      const user = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          refreshToken: null,
        },
      });

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token!');
    }
  }
}
