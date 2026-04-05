import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export type ProductImageFile = {
  buffer: Buffer;
  mimetype: string;
};

type CloudinaryErrorLike = {
  message?: string;
  error?: {
    message?: string;
  };
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadProductImage(file: ProductImageFile): Promise<string> {
    const folder =
      this.configService.get<string>('CLOUDINARY_FOLDER') ?? 'mo-marketplace';

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
      });

      return result.secure_url;
    } catch (error) {
      const message = this.extractCloudinaryErrorMessage(error);
      throw new InternalServerErrorException(
        `Failed to upload image: ${message}`,
      );
    }
  }

  private extractCloudinaryErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error && typeof error === 'object') {
      const typedError = error as CloudinaryErrorLike;

      if (typedError.message) {
        return typedError.message;
      }

      if (typedError.error?.message) {
        return typedError.error.message;
      }

      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown Cloudinary error';
      }
    }

    return 'Unknown Cloudinary error';
  }
}
