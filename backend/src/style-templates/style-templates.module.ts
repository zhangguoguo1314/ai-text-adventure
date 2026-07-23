import { Module } from '@nestjs/common';
import { StyleTemplatesController } from './style-templates.controller';
import { StyleTemplatesService } from './style-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StyleTemplatesController],
  providers: [StyleTemplatesService],
  exports: [StyleTemplatesService],
})
export class StyleTemplatesModule {}
