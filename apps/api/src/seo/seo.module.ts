import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AdminSeoController, SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [SettingsModule],
  controllers: [SeoController, AdminSeoController],
  providers: [SeoService],
})
export class SeoModule {}
