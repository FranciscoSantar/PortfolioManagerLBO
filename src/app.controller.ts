import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty } from '@nestjs/swagger';

import { Public } from './auth/decorators/public.decorator';

class healthResponse {
  @ApiProperty({
    description: 'Indicates if the API is healthy',
    example: true,
  })
  ok: boolean;
}
@Controller()
export class AppController {
  constructor() {}

  @ApiOperation({
    summary: 'Health check endpoint to verify that the API is running',
  })
  @ApiOkResponse({ description: 'API is healthy', type: healthResponse })
  @Public()
  @Get('health')
  health(): healthResponse {
    return {
      ok: true,
    };
  }
}
