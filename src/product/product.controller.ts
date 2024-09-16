import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtCookieAuthGuard } from 'src/common/jwt.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Role } from '@prisma/client';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from 'src/model/product.model';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('/api/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  private parseVariants(
    request: CreateProductRequest | UpdateProductRequest,
  ): any[] {
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

  @Get()
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  async getProducts(
    @Req() req,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productService.getProducts(req.userId, search, page, limit);
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

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  @Post(':productId')
  @FormDataRequest()
  async update(
    @Req() req,
    @Body() request: UpdateProductRequest,
    @Param('productId') productId: string,
  ) {
    const result = await this.productService.update(
      req.userId,
      productId,
      request,
    );

    return {
      statusCode: 200,
      data: result,
    };
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  @Delete(':productId')
  async destroy(@Req() req, @Param('productId') productId: string) {
    const result = await this.productService.deleteProduct(
      req.userId,
      productId,
    );

    return {
      statusCode: 200,
      message: result.message,
    };
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @SetMetadata('roles', [Role.STORE_OWNER])
  @Delete(':productId/variants/:variantId')
  async destroyProductVariant(
    @Req() req,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    const result = await this.productService.deleteProductVariant(
      req.userId,
      productId,
      variantId,
    );

    return {
      statusCode: 200,
      message: result.message,
    };
  }
}
