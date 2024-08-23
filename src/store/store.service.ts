import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import { StoreValidation } from './store.validation';

@Injectable()
export class StoreService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async update(
    storeId: string,
    request: UpdateStoreRequest,
  ): Promise<StoreResponse> {
    this.logger.debug(`update store request ${JSON.stringify(request)}`);

    const updateStoreRequest: UpdateStoreRequest =
      this.validationService.validate(StoreValidation.UPDATE_STORE, request);

    const store = await this.prismaService.store.update({
      where: {
        id: storeId,
      },
      data: {
        name: updateStoreRequest.name,
        description: updateStoreRequest.description,
        logo: updateStoreRequest.logo,
      },
    });

    return store;
  }
}
