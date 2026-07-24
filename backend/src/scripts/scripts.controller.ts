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
import { ScriptsService } from './scripts.service';
import {
  CreateScriptDto,
  UpdateScriptDto,
  QueryScriptDto,
  CreateNpcDto,
  UpdateNpcDto,
  BatchUpdateAttributesDto,
  CreateNodeDto,
  UpdateNodeDto,
} from './dto/scripts.dto';
import { GenerateCoverDto } from '../ai-image/dto/ai-image.dto';
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

  /* ===== NPC Endpoints ===== */

  @Get(':id/npcs')
  @ApiOperation({ summary: '获取剧本的NPC列表' })
  async listNpcs(@Param('id') id: string) {
    return this.scriptsService.listNpcs(Number(id));
  }

  @Post(':id/npcs')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加NPC' })
  async createNpc(@Param('id') id: string, @Body() dto: CreateNpcDto) {
    return this.scriptsService.createNpc(Number(id), dto);
  }

  @Put(':id/npcs/:npcId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新NPC' })
  async updateNpc(
    @Param('id') id: string,
    @Param('npcId') npcId: string,
    @Body() dto: UpdateNpcDto,
  ) {
    return this.scriptsService.updateNpc(Number(id), Number(npcId), dto);
  }

  @Delete(':id/npcs/:npcId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除NPC' })
  async deleteNpc(
    @Param('id') id: string,
    @Param('npcId') npcId: string,
  ) {
    return this.scriptsService.deleteNpc(Number(id), Number(npcId));
  }

  /* ===== Attribute Endpoints ===== */

  @Get(':id/attributes')
  @ApiOperation({ summary: '获取属性定义列表' })
  async listAttributes(@Param('id') id: string) {
    return this.scriptsService.listAttributes(Number(id));
  }

  @Put(':id/attributes')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量更新属性定义' })
  async batchUpdateAttributes(
    @Param('id') id: string,
    @Body() dto: BatchUpdateAttributesDto,
  ) {
    return this.scriptsService.batchUpdateAttributes(Number(id), dto);
  }

  /* ===== Node Endpoints ===== */

  @Get(':id/nodes')
  @ApiOperation({ summary: '获取剧情节点列表' })
  async listNodes(@Param('id') id: string) {
    return this.scriptsService.listNodes(Number(id));
  }

  @Post(':id/nodes')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建剧情节点' })
  async createNode(@Param('id') id: string, @Body() dto: CreateNodeDto) {
    return this.scriptsService.createNode(Number(id), dto);
  }

  @Put(':id/nodes/:nodeId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新节点' })
  async updateNode(
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateNodeDto,
  ) {
    return this.scriptsService.updateNode(Number(id), Number(nodeId), dto);
  }

  @Delete(':id/nodes/:nodeId')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除节点' })
  async deleteNode(
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.scriptsService.deleteNode(Number(id), Number(nodeId));
  }

  /* ===== AI Generation Endpoint ===== */

  @Post(':id/generate')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI生成初始内容' })
  async generateInitialContent(@Param('id') id: string) {
    return this.scriptsService.generateInitialContent(Number(id));
  }

  @Post(':id/generate-cover')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI生成剧本封面并保存' })
  async generateCover(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: GenerateCoverDto,
  ) {
    return this.scriptsService.generateCover(Number(id), req.user.id, dto);
  }
}
