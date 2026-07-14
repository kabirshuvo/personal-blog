import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async generateSitemap(): Promise<string> {
    const site = await this.settings.getSiteSettings();
    const baseUrl = (
      site.siteUrl ??
      process.env.WEB_ORIGIN ??
      'http://localhost:3000'
    ).replace(/\/$/, '');

    const [posts, categories, tags, authors] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.tag.findMany({
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.user.findMany({
        where: {
          posts: {
            some: { status: 'PUBLISHED' },
          },
        },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const urls = [
      { loc: `${baseUrl}/`, lastmod: new Date().toISOString() },
      ...posts.map((post) => ({
        loc: `${baseUrl}/posts/${post.slug}`,
        lastmod: post.updatedAt.toISOString(),
      })),
      ...categories.map((category) => ({
        loc: `${baseUrl}/categories/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
      })),
      ...tags.map((tag) => ({
        loc: `${baseUrl}/tags/${tag.slug}`,
        lastmod: tag.updatedAt.toISOString(),
      })),
      ...authors.map((author) => ({
        loc: `${baseUrl}/authors/${author.slug}`,
        lastmod: author.updatedAt.toISOString(),
      })),
    ];

    const body = urls
      .map(
        (url) => `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
  }

  async generateRobotsTxt(): Promise<string> {
    const site = await this.settings.getSiteSettings();
    const baseUrl = (
      site.siteUrl ??
      process.env.WEB_ORIGIN ??
      'http://localhost:3000'
    ).replace(/\/$/, '');
    const allow = site.seo?.robotsAllow !== false;

    if (!allow) {
      return 'User-agent: *\nDisallow: /';
    }

    return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
  }

  async findPostsMissingMeta() {
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ metaDescription: null }, { metaDescription: '' }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return {
      total: posts.length,
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        publishedAt: post.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
