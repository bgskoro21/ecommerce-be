import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import { StoreValidation } from './store.validation';
import { StoreResponse, UpdateStoreRequest } from 'src/model/store.model';

@Injectable()
export class StoreService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async update(
    email: string,
    request: UpdateStoreRequest,
  ): Promise<StoreResponse> {
    this.logger.debug(`update store request ${JSON.stringify(request)}`);

    const updateStoreRequest: UpdateStoreRequest =
      this.validationService.validate(StoreValidation.UPDATE_STORE, request);

    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
      include: {
        store: true, // Termasuk store yang terkait dengan user ini
      },
    });

    if (!user || !user.role) {
      throw new HttpException('Store not found!', 404);
    }

    const store = await this.prismaService.store.update({
      where: {
        id: user.store.id,
      },
      data: {
        name: updateStoreRequest.name,
        description: updateStoreRequest.description,
      },
    });

    return store;
  }
}
