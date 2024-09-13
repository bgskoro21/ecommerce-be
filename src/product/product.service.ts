import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { CreateProductRequest } from 'src/model/product.model';
import { Logger } from 'winston';
import { ProductValidation } from './product.validation';
import { extname } from 'path';
import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { UtilsService } from 'src/common/utils.service';
import { ProductImage } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private utilsService: UtilsService,
  ) {}

  async create(userId: string, request: CreateProductRequest) {
    this.logger.info(`Create product from ${userId}`);
    const req: CreateProductRequest = await this.validationService.validate(
      ProductValidation.CREATE_PRODUCT,
      request,
    );

    const store = await this.prismaService.store.findFirst({
      where: { userId: userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found!');
    }

    const filePaths: string[] = [];
    if (req.productImages.length > 0) {
      req.productImages.forEach((productImage, index) => {
        filePaths[index] = this.utilsService.saveFile(
          productImage,
          'products',
          req.name,
        );
      });
    }

    // Mulai transaction
    return this.prismaService.$transaction(async (prisma) => {
      // Create product
      const product = await prisma.product.create({
        data: {
          name: req.name,
          description: req.description,
          basePrice: req.basePrice,
          stock: parseInt(req.stock),
          shopId: store.id,
          hasVariants: req.variants && req.variants.length > 0 ? true : false,
        },
      });

      // Buat array objek untuk `createMany`
      const productImagesData = filePaths.map((filePath) => ({
        productId: product.id,
        image: filePath,
      }));

      // Create product images
      await prisma.productImage.createMany({
        data: productImagesData,
      });

      // Create variants if provided
      if (req.variants && req.variants.length > 0) {
        for (const [index, variantDto] of req.variants.entries()) {
          const fileVariantPath = this.utilsService.saveFile(
            variantDto.variantImage,
            'variants',
            req.name + ' ' + 'Variants',
          );

          const productVariant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              priceAdjustment: variantDto.priceAdjustment || '0.00',
              stock: variantDto.stock || 0,
              image: fileVariantPath,
            },
          });

          for (const optionDto of variantDto.variantOptions) {
            await prisma.productVariantOption.create({
              data: {
                variantId: productVariant.id,
                variantTypeId: optionDto.variantTypeId,
                value: optionDto.value,
              },
            });
          }
        }
      }

      // Setelah semua operasi berhasil, kembalikan product
      return product;
    });
  }
}
