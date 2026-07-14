import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { SeoService } from './seo.service';

@Controller()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  sitemap() {
    return this.seoService.generateSitemap();
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  robots() {
    return this.seoService.generateRobotsTxt();
  }
}

@Controller('admin/seo')
export class AdminSeoController {
  constructor(private readonly seoService: SeoService) {}

  @Permissions('seo:manage')
  @Get('posts-missing-meta')
  postsMissingMeta() {
    return this.seoService.findPostsMissingMeta();
  }
}
