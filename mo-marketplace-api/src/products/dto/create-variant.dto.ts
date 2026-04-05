import { Transform } from 'class-transformer';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

const ALLOWED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export class CreateVariantDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsIn(ALLOWED_SIZES)
  size!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  material!: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock!: number;
}
