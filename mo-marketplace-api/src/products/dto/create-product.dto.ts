import {
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @Transform(({ value }: { value: unknown }) => {
    let parsedValue = value;

    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        return value;
      }
    }

    if (!Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return parsedValue.map((variant) =>
      plainToInstance(CreateVariantDto, variant),
    );
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @ArrayMinSize(1)
  variants!: CreateVariantDto[];

  @IsOptional()
  @MaxLength(2048)
  @IsUrl()
  imageUrl?: string;
}
