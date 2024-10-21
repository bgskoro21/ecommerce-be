import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ForgotPasswordRequest,
  LoginUserRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
  UserResponse,
} from 'src/model/user.model';
import { WebResponse } from 'src/model/web.model';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('/api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @HttpCode(201)
  async register(
    @Body() request: RegisterUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.register(request);

    return {
      statusCode: 201,
      message:
        'Successfully created your account! Please check your email for verification.',
      data: result,
    };
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() request: LoginUserRequest,
    @Res({ passthrough: true }) res,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.login(request);

    return {
      statusCode: 200,
      message: 'Login Successfully!',
      data: result,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async me(@Req() request): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.me(request.user.userId);

    return {
      statusCode: 200,
      message: 'Get user success',
      data: result,
    };
  }

  @Post('/google-login')
  async googleLogin(
    @Body() { access_token, role }: { access_token: string; role: Role },
  ): Promise<WebResponse<UserResponse>> {
    console.log(access_token);
    const result = await this.userService.googleLogin({ access_token, role });

    return {
      statusCode: 200,
      message: 'Login Successfully!',
      data: result,
    };
  }

  @Post('/refresh')
  @HttpCode(200)
  async refresh(
    @Body() { refreshToken }: { refreshToken: string },
  ): Promise<WebResponse<UserResponse>> {
    const tokens = await this.userService.refresh(refreshToken);

    return {
      statusCode: 200,
      message: 'Refresh token successfully!',
      data: tokens,
    };
  }

  @Post('/verify')
  @HttpCode(200)
  async verify(
    @Body('token') token: string,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.verify(token);

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Post('/forgot-password')
  @HttpCode(200)
  async forgot(
    @Body() request: ForgotPasswordRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.forgot(request);

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Post('/reset-password')
  @HttpCode(200)
  async reset(
    @Body() request: ResetPasswordRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.reset(request);

    return {
      statusCode: 200,
      data: result,
    };
  }

  @Post('/logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async logout(
    @Body() { refreshToken }: { refreshToken: string },
  ): Promise<WebResponse<UserResponse>> {
    if (refreshToken) {
      await this.userService.logout(refreshToken);
    }

    return {
      statusCode: 200,
      message: 'Logout successfully.',
    };
  }
}
