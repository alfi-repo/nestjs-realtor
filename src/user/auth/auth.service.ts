import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SigninDto, SignupDto } from '../dto';
import * as bcrypt from 'bcryptjs';
import { User, UserType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(dto: SignupDto, userType: UserType) {
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (userExists) {
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        password: hashedPassword,
        user_type: userType,
      },
    });

    return this.generateJwt(user);
  }

  async signin(dto: SigninDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', 400);
    }

    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new HttpException('Invalid credentials', 400);
    }

    return this.generateJwt(user);
  }

  async generateProductKey(email: string, userType: UserType) {
    const string = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

    // should use a better mechanism due to bcrypt limited to 72 bytes
    return await bcrypt.hash(string, 10);
  }

  private generateJwt(user: User) {
    const token = jwt.sign(
      {
        name: user.name,
        id: user.id,
      },
      process.env.JSON_TOKEN_KEY,
      {
        expiresIn: 3600000, // should shorter, e.g. 15 min
      },
    );
    return token;
  }
}
