/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Variant } from '../variants/entities/variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  manager?: { transaction: jest.Mock };
};

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: MockRepo<Product>;
  let variantRepo: MockRepo<Variant>;

  const createDto: CreateProductDto = {
    name: 'Long Sleeve Shirt',
    description: 'Comfortable and breathable linen fabric shirt',
    imageUrl: 'https://example.com/shirt.jpg',
    variants: [
      { color: 'white', size: 'M', material: 'linen', stock: 10 },
      { color: 'black', size: 'L', material: 'linen', stock: 12 },
    ],
  };

  const existingProduct: Product = {
    id: 1,
    name: 'Existing Product',
    description: 'Existing description for tests',
    imageUrl: 'https://example.com/existing.jpg',
    variants: [],
  };

  beforeEach(() => {
    productRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(async () => []),
      findOne: jest.fn(async () => existingProduct),
      remove: jest.fn(async () => undefined),
      manager: {
        transaction: jest.fn(async (fn) =>
          fn({
            getRepository: (entity: unknown) => {
              if (entity === Product) {
                return {
                  findOne: jest.fn(async () => existingProduct),
                  save: jest.fn(async (value) => value),
                };
              }

              return {
                create: jest.fn((value) => value),
                createQueryBuilder: jest.fn(() => ({
                  delete: jest.fn().mockReturnThis(),
                  from: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  execute: jest.fn(async () => undefined),
                })),
              };
            },
          }),
        ),
      },
    };

    variantRepo = {
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(async () => undefined),
      })),
    };

    service = new ProductsService(
      productRepo as Repository<Product>,
      variantRepo as Repository<Variant>,
    );
  });

  it('creates product and generates combination keys', async () => {
    const result = await service.create(createDto);

    expect(productRepo.create).toHaveBeenCalledTimes(1);
    expect(productRepo.save).toHaveBeenCalledTimes(1);

    const createPayload = (productRepo.create as jest.Mock).mock
      .calls[0][0] as {
      variants: Array<{ combinationKey: string }>;
    };

    expect(createPayload.variants[0].combinationKey).toBe('white-m-linen');
    expect(createPayload.variants[1].combinationKey).toBe('black-l-linen');
    expect(result).toBeDefined();
  });

  it('throws bad request for duplicate variant combinations in create', async () => {
    await expect(
      service.create({
        ...createDto,
        variants: [
          { color: 'white', size: 'M', material: 'linen', stock: 10 },
          { color: 'white', size: 'M', material: 'linen', stock: 3 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps database unique violation to conflict exception in create', async () => {
    const dbError = new QueryFailedError('INSERT INTO variants', [], {
      code: '23505',
    } as never);

    (productRepo.save as jest.Mock).mockRejectedValue(dbError);

    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns not found for unknown product id', async () => {
    (productRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.findOneById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates inside transaction and replaces variants safely', async () => {
    const txProductSave = jest.fn(async (value) => value);
    const txVariantExecute = jest.fn(async () => undefined);

    productRepo.manager = {
      transaction: jest.fn(async (fn) =>
        fn({
          getRepository: (entity: unknown) => {
            if (entity === Product) {
              return {
                findOne: jest.fn(async () => ({ ...existingProduct })),
                save: txProductSave,
              };
            }

            return {
              create: jest.fn((value) => value),
              createQueryBuilder: jest.fn(() => ({
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: txVariantExecute,
              })),
            };
          },
        }),
      ),
    };

    const dto: UpdateProductDto = {
      name: 'Updated Product Name',
      variants: [{ color: 'blue', size: 'XL', material: 'linen', stock: 8 }],
    };

    const updated = await service.update(1, dto);

    expect(productRepo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(txVariantExecute).toHaveBeenCalledTimes(1);
    expect(txProductSave).toHaveBeenCalledTimes(1);
    expect(updated.name).toBe('Updated Product Name');
  });

  it('returns not found from update transaction when product does not exist', async () => {
    productRepo.manager = {
      transaction: jest.fn(async (fn) =>
        fn({
          getRepository: (entity: unknown) => {
            if (entity === Product) {
              return {
                findOne: jest.fn(async () => null),
                save: jest.fn(),
              };
            }

            return {
              create: jest.fn((value) => value),
              createQueryBuilder: jest.fn(() => ({
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn(async () => undefined),
              })),
            };
          },
        }),
      ),
    };

    await expect(service.update(123, { name: 'Nope' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicate variants on update before touching database', async () => {
    const txSpy = jest.fn(async (fn) =>
      fn({
        getRepository: (entity: unknown) => {
          if (entity === Product) {
            return {
              findOne: jest.fn(async () => ({ ...existingProduct })),
              save: jest.fn(async (value) => value),
            };
          }

          return {
            create: jest.fn((value) => value),
            createQueryBuilder: jest.fn(() => ({
              delete: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn(async () => undefined),
            })),
          };
        },
      }),
    );
    productRepo.manager = { transaction: txSpy };

    await expect(
      service.update(1, {
        variants: [
          { color: 'red', size: 'M', material: 'cotton', stock: 3 },
          { color: 'red', size: 'M', material: 'cotton', stock: 4 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(txSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes existing product successfully', async () => {
    const result = await service.remove(1);

    expect(productRepo.remove).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Product deleted successfully' });
  });
});
