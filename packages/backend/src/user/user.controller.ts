import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 获取所有用户 */
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  /** 创建用户 */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { username: string; password: string; displayName?: string; role?: string },
  ) {
    return this.userService.create(body);
  }

  /** 更新用户 */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { displayName?: string; role?: string; active?: boolean; password?: string },
  ) {
    return this.userService.update(id, body);
  }

  /** 删除用户 */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
