import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsObject()
  social?: Record<string, string | null>;

  @IsOptional()
  @IsObject()
  seo?: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    robotsAllow?: boolean;
    sitemapEnabled?: boolean;
  };
}
