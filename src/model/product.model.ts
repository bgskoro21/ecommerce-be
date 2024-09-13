import { MemoryStoredFile } from 'nestjs-form-data';

export class CreateProductRequest {
  name: string;
  description: string;
  basePrice: string;
  stock: string;
  productImages: Array<MemoryStoredFile>;
  variants?: CreateProductVariantRequest[];
}

class CreateProductVariantRequest {
  priceAdjustment: string;
  stock: number;
  variantImage?: MemoryStoredFile;
  variantOptions: CreateProductVariantOptionRequest[];
}

class CreateProductVariantOptionRequest {
  variantTypeId: string;
  value: string;
}
