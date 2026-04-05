import {
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';

export class UpdateProductDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @ArrayMinSize(1)
  variants?: CreateVariantDto[];

  @IsOptional()
  @MaxLength(2048)
  @IsUrl()
  imageUrl?: string;
}
