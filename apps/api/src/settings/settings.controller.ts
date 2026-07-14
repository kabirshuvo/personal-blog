import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UpdateSiteSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Permissions('settings:manage', 'seo:manage')
  @Get()
  getSettings() {
    return this.settingsService.getSiteSettings();
  }

  @Permissions('settings:manage', 'seo:manage')
  @Patch()
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.settingsService.updateSiteSettings(dto);
  }
}
