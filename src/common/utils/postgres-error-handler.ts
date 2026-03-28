import {
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';

export function handlePostgresError(error: any): never {

  if (error instanceof HttpException) { // if error is a Nest error, re-throw
    throw error;
  }

  if (error?.code) {
    if (error.code === '23505') {
      throw new ConflictException(`Duplicate value, ${error.detail}`);
    }
  }

  throw new InternalServerErrorException('Unexpected error');
}