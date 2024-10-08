import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { WebResponse } from 'src/model/web.model';
import { StoreResponse, UpdateStoreRequest } from '../model/store.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesGuard } from 'src/common/roles.guard';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('/api/store')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './storage/uploads',
        filename: (req, file, callback) => {
          const ext = extname(file.originalname);
          const name = req.body.name.replace(/\s+/g, '_');
          const filename = `${name}-${Date.now()}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  async update(
    @Req() req,
    @Body() request: UpdateStoreRequest,
    @UploadedFile() file?,
  ): Promise<WebResponse<StoreResponse>> {
    const result = await this.storeService.update(req.user.email, {
      ...request,
      logo: file.path,
    });

    return {
      statusCode: 200,
      data: result,
    };
  }
}
