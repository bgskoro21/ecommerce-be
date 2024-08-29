import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtCookieAuthGuard } from 'src/common/jwt.guard';
import { WebResponse } from 'src/model/web.model';
import { StoreResponse, UpdateStoreRequest } from '../model/store.model';

@Controller('/api/store')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(JwtCookieAuthGuard)
  async update(
    @Req() req,
    @Body() request: UpdateStoreRequest,
  ): Promise<WebResponse<StoreResponse>> {
    const result = await this.storeService.update(req.user.email, request);

    return {
      statusCode: 200,
      data: result,
    };
  }
}
