import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchScriptsDto, SearchSuggestDto } from './dto/search.dto';
import { CombinedAuthGuard } from '../auth/auth.guard';

@ApiTags('搜索')
@Controller('api/search')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('scripts')
  @ApiOperation({ summary: '搜索剧本' })
  async searchScripts(@Query() dto: SearchScriptsDto, @Req() req: any) {
    return this.searchService.searchScripts(dto, req.user?.id);
  }

  @Get('hot-keywords')
  @ApiOperation({ summary: '获取热门搜索关键词' })
  async getHotKeywords() {
    return this.searchService.getHotKeywords();
  }

  @Get('suggest')
  @ApiOperation({ summary: '搜索建议' })
  async suggest(@Query() dto: SearchSuggestDto) {
    return this.searchService.suggest(dto);
  }

  @Get('history')
  @ApiOperation({ summary: '获取搜索历史' })
  async getSearchHistory(@Req() req: any) {
    return this.searchService.getSearchHistory(req.user?.id);
  }
}
