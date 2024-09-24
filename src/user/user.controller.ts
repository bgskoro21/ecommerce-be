import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
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
      data: result,
    };
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() request: LoginUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.login(request);

    return {
      statusCode: 200,
      message: 'Login Successfully!',
      data: result,
    };
  }

  @Post('/google-login')
  async googleLogin(
    @Body() { code, role }: { code: string; role: Role },
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.googleLogin({ code, role });

    return {
      statusCode: 200,
      message: 'Login Successfully!',
      data: result,
    };
  }

  @Post('/refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request): Promise<WebResponse<UserResponse>> {
    const refreshToken = req.cookies['refreshToken'];

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
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = req.cookies['refreshToken'];

    if (refreshToken) {
      // Hapus refresh token dari database
      await this.userService.logout(refreshToken);
    }

    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });

    res.json({
      statusCode: 200,
      message: 'Logout successfull!',
    });
  }
}
