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
  ForgotPasswordRequest,
  LoginUserRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
  UserResponse,
} from 'src/model/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private httpService: HttpService,
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

    const { confirmPassword, ...sanitizedRequest } = request;

    return await this.prismaService.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: sanitizedRequest,
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
      throw new HttpException('Email or password is wrong!', 403);
    }

    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpException('Email or password is wrong!', 403);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return tokens;
  }

  async googleLogin({
    code,
    role,
  }: {
    code: string;
    role: Role;
  }): Promise<UserResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const userInfoUrl =
      'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';

    const { data: tokenData } = await firstValueFrom(
      this.httpService.post(tokenUrl, {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/api/auth/callback',
        grant_type: 'authorization_code',
      }),
    );

    const { access_token } = tokenData;

    const { data: userInfo } = await firstValueFrom(
      this.httpService.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    );

    let user = await this.prismaService.user.findFirst({
      where: {
        email: userInfo.email,
      },
    });

    if (!user) {
      await this.prismaService.$transaction(async (prisma) => {
        user = await prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.given_name,
            verifiedAt: new Date(),
            role,
          },
        });

        if (user.role === 'STORE_OWNER') {
          await prisma.store.create({
            data: {
              userId: user.id,
              name: user.name,
            },
          });
        }
      });
    } else {
      if (user.role !== Role.STORE_OWNER && role === Role.STORE_OWNER) {
        await this.prismaService.$transaction(async (prisma) => {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: Role.STORE_OWNER },
          });

          await prisma.store.create({
            data: {
              userId: user.id,
              name: user.name,
            },
          });
        });
      }
    }

    return await this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
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
        select: { refreshToken: true, role: true },
      });

      if (user.refreshToken !== refreshToken) {
        throw new HttpException('Invalid refresh token', 400);
      }

      const newTokens = await this.generateTokens(
        userId,
        payload.email,
        user.role,
      );
      return newTokens;
    } catch (error) {
      throw new HttpException('Invalid refresh token!', 400);
    }
  }

  async verify(token: string): Promise<UserResponse> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const { userId } = payload;

      const user = await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          verifiedAt: new Date(),
        },
      });

      return {
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      throw new HttpException('Invalid token!', 400);
    }
  }

  async forgot(request: ForgotPasswordRequest): Promise<UserResponse> {
    this.logger.debug(
      `Forgot password request from ${JSON.stringify(request)}`,
    );
    const forgotPasswordRequest: ForgotPasswordRequest =
      await this.validationService.validate(
        UserValidation.FORGOT_PASSWORD,
        request,
      );

    const user = await this.prismaService.user.findUnique({
      where: {
        email: forgotPasswordRequest.email,
      },
    });

    if (!user) {
      throw new HttpException('Email not found', 404);
    }

    await this.prismaService.emailLog.create({
      data: {
        userId: user.id,
        email: user.email,
        type: 'ForgotPassword',
        status: 'Pending',
      },
    });

    return {
      name: user.name,
      email: user.email,
    };
  }

  async reset(request: ResetPasswordRequest): Promise<UserResponse> {
    const resetPasswordRequest: ResetPasswordRequest =
      await this.validationService.validate(
        UserValidation.RESET_PASSWORD,
        request,
      );
    try {
      const payload = await this.jwtService.verify(resetPasswordRequest.token, {
        secret: process.env.JWT_SECRET,
      });

      const { userId } = payload;

      let user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new HttpException('User not found!', 404);
      }

      user = await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          password: await bcrypt.hash(resetPasswordRequest.newPassword, 10),
        },
      });

      return {
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      throw new HttpException('Invalid token!', 403);
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
