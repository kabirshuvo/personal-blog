import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MediaQueryDto, UpdateMediaDto, UploadMediaDto } from './dto/media.dto';
import { MediaService } from './media.service';

@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Permissions('media:upload')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    return this.mediaService.upload(user, file, dto);
  }

  @Permissions('media:manage')
  @Get()
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Permissions('media:manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Permissions('media:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Permissions('media:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
