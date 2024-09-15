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

export class UpdateProductRequest {
  name?: string;
  description?: string;
  basePrice?: string;
  stock?: string;
  productImages?: Array<MemoryStoredFile>;
  variants?: UpdateProductVariantRequest[];
}

class UpdateProductVariantRequest {
  id?: string; // Field 'id' untuk mengidentifikasi varian yang ada
  priceAdjustment?: string;
  stock?: string;
  variantImage?: MemoryStoredFile;
  variantOptions: UpdateProductVariantOptionRequest[];
}

class UpdateProductVariantOptionRequest {
  variantTypeId: string;
  value: string;
}
