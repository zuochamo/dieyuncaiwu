import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.userService.validateUser(body.username, body.password);
    if (!user) {
      return { success: false, message: '账号或密码错误' };
    }
    // TODO: 后续可换为 JWT token
    return { success: true, ...user };
  }
}
