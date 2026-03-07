import { Body, Controller, Post, Version } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Version('1')
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}