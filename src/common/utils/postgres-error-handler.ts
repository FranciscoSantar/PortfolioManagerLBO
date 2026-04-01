import {
  ConflictException,
  InternalServerErrorException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';

export function handlePostgresError(error: unknown): never {
  if (error instanceof HttpException) {
    // if error is a Nest error, re-throw
    throw error;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as { code: string; detail?: string };

    if (pgError.code === '23505') {
      throw new ConflictException(`Duplicate value, ${pgError.detail}`);
    }

    if (pgError.code === '22003') {
      throw new BadRequestException(`Invalid value, ${pgError.detail}`);
    }
  }

  throw new InternalServerErrorException('Unexpected error');
}
