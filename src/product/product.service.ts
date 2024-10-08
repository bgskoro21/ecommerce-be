import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from 'src/model/product.model';
import { Logger } from 'winston';
import { ProductValidation } from './product.validation';
import { UtilsService } from 'src/common/utils.service';
import { promises as fs } from 'fs';

@Injectable()
export class ProductService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private utilsService: UtilsService,
  ) {}

  async getProducts(
    userId: string,
    search: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const store = await this.prismaService.store.findFirst({
      where: { userId: userId },
    });

    // Build query condition based on search parameter
    const whereCondition = {
      shopId: store.id, // Tambahkan kondisi shopId
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Fetch products with pagination
    const products = await this.prismaService.product.findMany({
      where: whereCondition as any,
      skip: skip,
      take: limit,
    });

    // Get total count of products for pagination
    const totalCount = await this.prismaService.product.count({
      where: whereCondition as any,
    });

    return {
      data: products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

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

  async update(
    userId: string,
    productId: string,
    request: UpdateProductRequest,
  ) {
    this.logger.info(`Update product ${productId} by user ${userId}`);
    const req: UpdateProductRequest = await this.validationService.validate(
      ProductValidation.UPDATE_PRODUCT,
      request,
    );

    // Cari store berdasarkan userId
    const store = await this.prismaService.store.findFirst({
      where: { userId: userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found!');
    }

    // Cek apakah produk ada
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, shopId: store.id },
      include: {
        productImages: true, // Include images to handle removal later
        variants: {
          include: { variantOptions: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    const filePaths: string[] = [];
    if (req.productImages && req.productImages.length > 0) {
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
      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          name: req.name,
          description: req.description,
          basePrice: req.basePrice,
          stock: parseInt(req.stock),
          hasVariants: req.variants && req.variants.length > 0 ? true : false,
        },
      });

      // Handle gambar produk (hapus gambar lama jika ada gambar baru)
      if (filePaths.length > 0) {
        // Hapus gambar lama dari storage
        for (const oldImage of product.productImages) {
          try {
            await fs.unlink(oldImage.image);
            this.logger.info(`Old product image removed: ${oldImage.image}`);
          } catch (err) {
            this.logger.warn(`Failed to remove old image: ${oldImage.image}`);
          }
        }

        // Hapus gambar lama dari database
        await prisma.productImage.deleteMany({
          where: { productId: product.id },
        });

        // Tambahkan gambar produk baru ke database
        const productImagesData = filePaths.map((filePath) => ({
          productId: product.id,
          image: filePath,
        }));

        await prisma.productImage.createMany({
          data: productImagesData,
        });
      }

      // Handle varian produk (update atau tambahkan varian baru)
      if (req.variants && req.variants.length > 0) {
        for (const [index, variantDto] of req.variants.entries()) {
          const fileVariantPath = this.utilsService.saveFile(
            variantDto.variantImage,
            'variants',
            req.name + ' ' + 'Variants',
          );

          let productVariant = await prisma.productVariant.findFirst({
            where: { productId: product.id, id: variantDto.id },
          });

          if (productVariant) {
            // Jika ada gambar baru, hapus gambar varian lama dari storage
            if (productVariant.image && fileVariantPath) {
              try {
                await fs.unlink(productVariant.image);
                this.logger.info(
                  `Old variant image removed: ${productVariant.image}`,
                );
              } catch (err) {
                this.logger.warn(
                  `Failed to remove old variant image: ${productVariant.image}`,
                );
              }
            }

            // Update variant
            productVariant = await prisma.productVariant.update({
              where: { id: productVariant.id },
              data: {
                priceAdjustment: variantDto.priceAdjustment || '0.00',
                stock: parseInt(variantDto.stock) || 0,
                image: fileVariantPath,
              },
            });

            // Update opsi varian
            for (const optionDto of variantDto.variantOptions) {
              const existingOption =
                await prisma.productVariantOption.findFirst({
                  where: {
                    variantId: productVariant.id,
                    variantTypeId: optionDto.variantTypeId,
                  },
                });

              if (existingOption) {
                // Jika sudah ada, update value-nya
                await prisma.productVariantOption.update({
                  where: {
                    id: existingOption.id, // Menggunakan primary key `id` untuk update
                  },
                  data: {
                    value: optionDto.value,
                  },
                });
              } else {
                // Jika belum ada, buat record baru
                await prisma.productVariantOption.create({
                  data: {
                    variantId: productVariant.id,
                    variantTypeId: optionDto.variantTypeId,
                    value: optionDto.value,
                  },
                });
              }
            }
          } else {
            // Jika varian tidak ada, buat baru
            productVariant = await prisma.productVariant.create({
              data: {
                productId: product.id,
                priceAdjustment: variantDto.priceAdjustment || '0.00',
                stock: parseInt(variantDto.stock) || 0,
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
      }

      // Kembalikan produk yang diperbarui
      return updatedProduct;
    });
  }

  async deleteProduct(userId: string, productId: string) {
    this.logger.info(`Delete product ${productId} by user ${userId}`);

    // Cari store berdasarkan userId
    const store = await this.prismaService.store.findFirst({
      where: { userId: userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found!');
    }

    // Cek apakah produk ada
    const product = await this.prismaService.product.findFirst({
      where: { id: productId, shopId: store.id },
      include: {
        productImages: true,
        variants: {
          include: { variantOptions: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    return this.prismaService.$transaction(async (prisma) => {
      // Hapus gambar produk dari storage
      for (const image of product.productImages) {
        try {
          await fs.unlink(image.image);
          this.logger.info(`Product image removed: ${image.image}`);
        } catch (err) {
          this.logger.warn(`Failed to remove product image: ${image.image}`);
        }
      }

      // Hapus varian dan opsi varian
      for (const variant of product.variants) {
        for (const option of variant.variantOptions) {
          await prisma.productVariantOption.delete({
            where: { id: option.id },
          });
        }
        // Hapus varian setelah opsi variannya dihapus
        if (variant.image) {
          try {
            await fs.unlink(variant.image);
            this.logger.info(`Variant image removed: ${variant.image}`);
          } catch (err) {
            this.logger.warn(
              `Failed to remove variant image: ${variant.image}`,
            );
          }
        }
        await prisma.productVariant.delete({
          where: { id: variant.id },
        });
      }

      // Hapus gambar dari database
      await prisma.productImage.deleteMany({
        where: { productId: productId },
      });

      // Hapus produk
      await prisma.product.delete({
        where: { id: product.id },
      });

      this.logger.info(`Product ${productId} deleted successfully.`);
      return { message: 'Product deleted successfully.' };
    });
  }

  async deleteProductVariant(
    userId: string,
    productId: string,
    variantId: string,
  ) {
    this.logger.info(
      `Delete variant ${variantId} for product ${productId} by user ${userId}`,
    );

    // Cari store berdasarkan userId
    const store = await this.prismaService.store.findFirst({
      where: { userId: userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found!');
    }

    // Cek apakah varian dari produk ada
    const productVariant = await this.prismaService.productVariant.findFirst({
      where: {
        id: variantId,
        productId: productId,
      },
      include: {
        variantOptions: true,
      },
    });

    if (!productVariant) {
      throw new NotFoundException('Product variant not found!');
    }

    return this.prismaService.$transaction(async (prisma) => {
      // Hapus opsi varian terkait
      for (const option of productVariant.variantOptions) {
        await prisma.productVariantOption.delete({
          where: { id: option.id },
        });
      }

      // Hapus gambar varian dari storage jika ada
      if (productVariant.image) {
        try {
          await fs.unlink(productVariant.image);
          this.logger.info(`Variant image removed: ${productVariant.image}`);
        } catch (err) {
          this.logger.warn(
            `Failed to remove variant image: ${productVariant.image}`,
          );
        }
      }

      // Hapus varian dari database
      await prisma.productVariant.delete({
        where: { id: productVariant.id },
      });

      this.logger.info(`Product variant ${variantId} deleted successfully.`);
      return { message: 'Product variant deleted successfully.' };
    });
  }
}
