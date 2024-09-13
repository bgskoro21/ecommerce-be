import {
  Body,
  Controller,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtCookieAuthGuard } from 'src/common/jwt.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Role } from '@prisma/client';
import { CreateProductRequest } from 'src/model/product.model';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { UtilsService } from 'src/common/utils.service';

@Controller('/api/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  private parseVariants(request: CreateProductRequest): any[] {
    const variants = [];
    let index = 0;

    while (request[`variants[${index}].priceAdjustment`] !== undefined) {
      const variant = {
        priceAdjustment: request[`variants[${index}].priceAdjustment`],
        stock: parseInt(request[`variants[${index}].stock`], 10),
        variantImage: request[`variants[${index}].variantImage`],
        variantOptions: [],
      };

      let optionIndex = 0;
      while (
        request[
          `variants[${index}].variantOptions[${optionIndex}].variantTypeId`
        ] !== undefined
      ) {
        const variantOption = {
          variantTypeId:
            request[
              `variants[${index}].variantOptions[${optionIndex}].variantTypeId`
            ],
          value:
            request[`variants[${index}].variantOptions[${optionIndex}].value`],
        };
        variant.variantOptions.push(variantOption);
        optionIndex++;
      }

      variants.push(variant);
      index++;
    }

    return variants;
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  @Post()
  @FormDataRequest()
  async create(@Req() req, @Body() request: CreateProductRequest) {
    request.variants = this.parseVariants(request);
    const result = await this.productService.create(req.userId, request);
    return {
      statusCode: 201,
      data: result,
    };
  }
}
