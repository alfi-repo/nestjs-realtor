import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { ProductKeyDto, SigninDto, SignupDto } from '../dto';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:userType')
  async signup(
    @Body() dto: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!dto.productKey) {
        throw new UnauthorizedException();
      }

      const productKey = `${dto.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
      const isValidProductKey = await bcrypt.compare(
        productKey,
        dto.productKey,
      );

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }
    }

    return this.authService.signup(dto, userType);
  }

  @Post('/signin')
  async signin(@Body() dto: SigninDto) {
    const token = await this.authService.signin(dto);

    return { access_token: token };
  }

  @Post('/key')
  generateProductKey(@Body() dto: ProductKeyDto) {
    return this.authService.generateProductKey(dto.email, dto.userType);
  }

  @Get('/me')
  me(@User() user) {
    return user;
  }
}
