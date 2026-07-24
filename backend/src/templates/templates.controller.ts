import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import {
  QueryTemplateDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  RateTemplateDto,
} from './dto/templates.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('剧本模板')
@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: '模板列表（公开，分页+分类+排序）' })
  async list(@Query() dto: QueryTemplateDto) {
    return this.templatesService.list(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '模板详情（公开）' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(Number(id));
  }

  @Post(':id/apply')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '应用模板创建剧本（需要鉴权）' })
  async apply(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.apply(Number(id), req.user.id);
  }

  @Post()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '从剧本创建自定义模板（需要鉴权）' })
  async create(@Req() req: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新模板（仅作者或管理员）' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(
      Number(id),
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除模板（仅作者或管理员）' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.remove(
      Number(id),
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/rate')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '评分（需要鉴权，0-5星）' })
  async rate(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RateTemplateDto,
  ) {
    return this.templatesService.rate(Number(id), req.user.id, dto);
  }
}
