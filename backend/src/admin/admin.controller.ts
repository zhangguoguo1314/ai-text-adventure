import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CombinedAuthGuard } from '../auth/auth.guard';
import {
  QueryUsersDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdjustUserBalanceDto,
  QueryScriptsDto,
  UpdateScriptStatusDto,
  ToggleFeaturedDto,
  CreateModelDto,
  UpdateModelDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  CreateRedemptionCodeDto,
  QueryTransactionsDto,
} from './dto/admin.dto';

@ApiTags('管理后台')
@Controller('api/admin')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 仪表盘统计 ====================

  @Get('dashboard')
  @ApiOperation({ summary: '仪表盘统计数据' })
  async getDashboard(@Req() req: any) {
    return this.adminService.getDashboard(req.user.id);
  }

  // ==================== 用户管理 ====================

  @Get('users')
  @ApiOperation({ summary: '用户列表（分页、搜索、状态筛选）' })
  async getUsers(@Req() req: any, @Query() dto: QueryUsersDto) {
    return this.adminService.getUsers(req.user.id, dto);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: '修改用户状态' })
  async updateUserStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user.id, id, dto);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: '修改用户角色' })
  async updateUserRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user.id, id, dto);
  }

  @Post('users/:id/balance')
  @ApiOperation({ summary: '调整用户余额（赠送/扣除UU币）' })
  async adjustUserBalance(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustUserBalanceDto,
  ) {
    return this.adminService.adjustUserBalance(req.user.id, id, dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '用户详情（含余额、交易记录）' })
  async getUserDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getUserDetail(req.user.id, id);
  }

  // ==================== 剧本管理 ====================

  @Get('scripts')
  @ApiOperation({ summary: '剧本列表（分页、状态筛选、搜索）' })
  async getScripts(@Req() req: any, @Query() dto: QueryScriptsDto) {
    return this.adminService.getScripts(req.user.id, dto);
  }

  @Put('scripts/:id/status')
  @ApiOperation({ summary: '审核剧本（发布/拒绝）' })
  async updateScriptStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScriptStatusDto,
  ) {
    return this.adminService.updateScriptStatus(req.user.id, id, dto);
  }

  @Put('scripts/:id/featured')
  @ApiOperation({ summary: '设为精选/取消精选' })
  async toggleFeatured(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleFeaturedDto,
  ) {
    return this.adminService.toggleFeatured(req.user.id, id, dto);
  }

  @Delete('scripts/:id')
  @ApiOperation({ summary: '删除剧本（软删除/归档）' })
  async deleteScript(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteScript(req.user.id, id);
  }

  @Post('scripts/:id/force-delete')
  @ApiOperation({ summary: '强制删除剧本（硬删除）' })
  async forceDeleteScript(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.forceDeleteScript(req.user.id, id);
  }

  // ==================== 模型管理 ====================

  @Get('models')
  @ApiOperation({ summary: '获取所有AI模型列表' })
  async getModels(@Req() req: any) {
    return this.adminService.getModels(req.user.id);
  }

  @Post('models')
  @ApiOperation({ summary: '创建AI模型配置' })
  async createModel(@Req() req: any, @Body() dto: CreateModelDto) {
    return this.adminService.createModel(req.user.id, dto);
  }

  @Put('models/:id')
  @ApiOperation({ summary: '更新模型配置' })
  async updateModel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModelDto,
  ) {
    return this.adminService.updateModel(req.user.id, id, dto);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: '删除模型' })
  async deleteModel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteModel(req.user.id, id);
  }

  @Put('models/:id/toggle')
  @ApiOperation({ summary: '启用/禁用模型' })
  async toggleModel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.toggleModel(req.user.id, id);
  }

  // ==================== 公告管理 ====================

  @Get('announcements')
  @ApiOperation({ summary: '公告列表' })
  async getAnnouncements(@Req() req: any) {
    return this.adminService.getAnnouncements(req.user.id);
  }

  @Post('announcements')
  @ApiOperation({ summary: '创建公告' })
  async createAnnouncement(@Req() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.adminService.createAnnouncement(req.user.id, dto);
  }

  @Put('announcements/:id')
  @ApiOperation({ summary: '更新公告' })
  async updateAnnouncement(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.adminService.updateAnnouncement(req.user.id, id, dto);
  }

  @Delete('announcements/:id')
  @ApiOperation({ summary: '删除公告' })
  async deleteAnnouncement(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteAnnouncement(req.user.id, id);
  }

  // ==================== 兑换码管理 ====================

  @Get('codes')
  @ApiOperation({ summary: '兑换码列表' })
  async getCodes(@Req() req: any) {
    return this.adminService.getCodes(req.user.id);
  }

  @Post('codes')
  @ApiOperation({ summary: '创建兑换码' })
  async createCode(@Req() req: any, @Body() dto: CreateRedemptionCodeDto) {
    return this.adminService.createCode(req.user.id, dto);
  }

  @Delete('codes/:id')
  @ApiOperation({ summary: '删除兑换码' })
  async deleteCode(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteCode(req.user.id, id);
  }

  // ==================== 交易记录 ====================

  @Get('transactions')
  @ApiOperation({ summary: '交易记录列表' })
  async getTransactions(@Req() req: any, @Query() dto: QueryTransactionsDto) {
    return this.adminService.getTransactions(req.user.id, dto);
  }
}
