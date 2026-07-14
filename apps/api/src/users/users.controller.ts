import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  AdminUsersQueryDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('me/password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, dto);
  }
}

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions('users:manage')
  @Get()
  findAll(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAllAdmin(query);
  }
}
