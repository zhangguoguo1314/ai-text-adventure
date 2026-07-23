import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto, UpdateScriptDto, QueryScriptDto } from './dto/scripts.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('剧本')
@Controller('api/scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @Get()
  @ApiOperation({ summary: '剧本列表（分页+搜索+排序）' })
  async list(@Query() dto: QueryScriptDto) {
    return this.scriptsService.list(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '剧本详情' })
  async findOne(@Param('id') id: string) {
    return this.scriptsService.findOne(Number(id));
  }

  @Post()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建剧本' })
  async create(@Req() req: any, @Body() dto: CreateScriptDto) {
    return this.scriptsService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新剧本' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateScriptDto,
  ) {
    return this.scriptsService.update(Number(id), req.user.id, dto);
  }

  @Post(':id/publish')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布剧本' })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.scriptsService.publish(Number(id), req.user.id);
  }
}
