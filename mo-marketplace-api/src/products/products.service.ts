import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Variant } from '../variants/entities/variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';

type DriverErrorWithCode = {
  code?: string;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
  ) {}

  private generateKey(v: CreateVariantDto): string {
    return `${v.color}-${v.size}-${v.material}`.toLowerCase();
  }

  private validateUniqueVariants(variants: CreateVariantDto[]) {
    const keys = variants.map((v) => this.generateKey(v));

    const unique = new Set(keys);

    if (keys.length !== unique.size) {
      throw new BadRequestException('Duplicate variant combinations found');
    }
  }

  private mapDbError(error: unknown): never {
    const driverError =
      error instanceof QueryFailedError
        ? (error.driverError as DriverErrorWithCode | undefined)
        : undefined;

    if (driverError?.code === '23505') {
      throw new ConflictException(
        'Variant combination must be unique based on database constraints',
      );
    }

    throw error;
  }

  async create(dto: CreateProductDto) {
    // 1. Prevent duplicates
    this.validateUniqueVariants(dto.variants);

    // 2. Create product
    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      variants: dto.variants.map((v) => ({
        ...v,
        combinationKey: this.generateKey(v),
      })),
    });

    try {
      return await this.productRepo.save(product);
    } catch (error) {
      this.mapDbError(error);
    }
  }

  async findAll() {
    return this.productRepo.find();
  }

  async findOneById(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    try {
      return await this.productRepo.manager.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        const variantRepo = manager.getRepository(Variant);

        const product = await productRepo.findOne({
          where: { id },
        });

        if (!product) {
          throw new NotFoundException(`Product with id ${id} not found`);
        }

        if (dto.variants) {
          this.validateUniqueVariants(dto.variants);

          await variantRepo
            .createQueryBuilder()
            .delete()
            .from(Variant)
            .where('productId = :id', { id })
            .execute();

          product.variants = dto.variants.map((v) =>
            variantRepo.create({
              ...v,
              combinationKey: this.generateKey(v),
            }),
          );
        }

        if (dto.name !== undefined) {
          product.name = dto.name;
        }

        if (dto.description !== undefined) {
          product.description = dto.description;
        }

        if (dto.imageUrl !== undefined) {
          product.imageUrl = dto.imageUrl;
        }

        return productRepo.save(product);
      });
    } catch (error) {
      this.mapDbError(error);
    }
  }

  async remove(id: number) {
    const product = await this.findOneById(id);
    await this.productRepo.remove(product);

    return { message: 'Product deleted successfully' };
  }
}
