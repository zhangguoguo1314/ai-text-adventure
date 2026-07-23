import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StyleTemplatesService } from './style-templates.service';

@ApiTags('文风模板')
@Controller('api/style-templates')
export class StyleTemplatesController {
  constructor(private readonly service: StyleTemplatesService) {}

  @Get()
  @ApiOperation({ summary: '获取文风模板列表' })
  async findAll() {
    return this.service.findAll();
  }
}
