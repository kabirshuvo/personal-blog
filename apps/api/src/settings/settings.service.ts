import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type SiteSettings = {
  name?: string;
  description?: string;
  siteUrl?: string;
  logoUrl?: string | null;
  social?: Record<string, string | null>;
  seo?: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    robotsAllow?: boolean;
    sitemapEnabled?: boolean;
  };
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSiteSettings(): Promise<SiteSettings> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'site' },
    });

    return (setting?.value as SiteSettings) ?? {};
  }

  async updateSiteSettings(value: SiteSettings) {
    const current = await this.getSiteSettings();
    const merged = { ...current, ...value };

    const updated = await this.prisma.setting.upsert({
      where: { key: 'site' },
      create: {
        key: 'site',
        value: merged,
      },
      update: {
        value: merged,
      },
    });

    return updated.value as SiteSettings;
  }
}
