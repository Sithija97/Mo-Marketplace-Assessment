import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';
import { CreateVariantDto } from './create-variant.dto';

describe('Product DTO validation', () => {
  it('accepts valid create product payload', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: '  Long Sleeve Shirt  ',
      description: '  Comfortable and breathable linen fabric shirt  ',
      imageUrl: 'https://example.com/item.jpg',
      variants: [
        { color: '  white ', size: 'm', material: ' linen ', stock: 10 },
      ],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Long Sleeve Shirt');
    expect(dto.description).toBe(
      'Comfortable and breathable linen fabric shirt',
    );
    expect(dto.variants[0].color).toBe('white');
    expect(dto.variants[0].size).toBe('M');
    expect(dto.variants[0].material).toBe('linen');
  });

  it('rejects invalid create product payload with short fields', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'A',
      description: 'short',
      variants: [{ color: '', size: 'M', material: 'linen', stock: 10 }],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid variant sizes and invalid stock bounds', async () => {
    const sizeDto = plainToInstance(CreateVariantDto, {
      color: 'blue',
      size: 'XLM',
      material: 'linen',
      stock: 1,
    });

    const stockDto = plainToInstance(CreateVariantDto, {
      color: 'blue',
      size: 'M',
      material: 'linen',
      stock: -1,
    });

    const sizeErrors = await validate(sizeDto);
    const stockErrors = await validate(stockDto);

    expect(sizeErrors.length).toBeGreaterThan(0);
    expect(stockErrors.length).toBeGreaterThan(0);
  });

  it('allows partial update with business constraints when provided', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      name: '  Updated Name  ',
      description: '  Updated description with enough length  ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Updated Name');
    expect(dto.description).toBe('Updated description with enough length');
  });

  it('rejects update payload with invalid imageUrl and empty variant array', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      imageUrl: 'not-an-url',
      variants: [],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
