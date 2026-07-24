import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RankingService } from './ranking.service';

@ApiTags('排行榜')
@Controller('api/ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('scripts')
  @ApiOperation({ summary: '剧本排行榜（按游玩次数）' })
  async getScriptsRanking(
    @Query('period') period?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rankingService.getScriptsRanking(
      period || 'week',
      category || 'all',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('creators')
  @ApiOperation({ summary: '创作者排行榜（按剧本总游玩次数）' })
  async getCreatorsRanking(
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rankingService.getCreatorsRanking(
      period || 'week',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('players')
  @ApiOperation({ summary: '玩家排行榜（按游玩次数）' })
  async getPlayersRanking(
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rankingService.getPlayersRanking(
      period || 'week',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
