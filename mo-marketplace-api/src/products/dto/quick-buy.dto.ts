import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class QuickBuyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}
