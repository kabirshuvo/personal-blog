import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CacheModule } from './cache/cache.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import {
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from './common/guards/auth.guards';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { DatabaseModule } from './database/database.module';
import { MediaModule } from './media/media.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { ReadingHistoryModule } from './reading-history/reading-history.module';
import { RedisModule } from './redis/redis.module';
import { SeoModule } from './seo/seo.module';
import { SettingsModule } from './settings/settings.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      },
    }),
    DatabaseModule,
    RedisModule,
    CacheModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TagsModule,
    PostsModule,
    MediaModule,
    CommentsModule,
    BookmarksModule,
    ReadingHistoryModule,
    SeoModule,
    SettingsModule,
    AnalyticsModule,
    NewsletterModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
