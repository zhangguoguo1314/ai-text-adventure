import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 健康检查端点（供 Docker 和负载均衡器使用）
  @Get('api/health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
