import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard/jwt-auth.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { QuickBuyDto } from './dto/quick-buy.dto';
import type { ProductImageFile } from './cloudinary.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
@ApiTags('Products')
@ApiBearerAuth('bearer')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('with-image')
  @ApiOperation({
    summary: 'Create a new product with image upload (admin only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  createWithImage(
    @Body() dto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .addFileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: ProductImageFile,
  ) {
    return this.service.createWithImage(dto, file);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with optional filters and pagination',
  })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneById(id);
  }

  @Roles(UserRole.USER)
  @Post(':id/quick-buy')
  @ApiOperation({
    summary: 'Quick buy a specific variant and reduce stock (user only)',
  })
  quickBuy(@Param('id', ParseIntPipe) id: number, @Body() dto: QuickBuyDto) {
    return this.service.quickBuy(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
