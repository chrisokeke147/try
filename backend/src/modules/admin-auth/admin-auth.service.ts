import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from './entities/admin-user.entity';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser) private readonly adminUsers: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminUsers.findOne({ where: { email: email.toLowerCase() } });
    // Same error for "no such admin" and "wrong password" — don't leak which one it was.
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({ sub: admin.id, email: admin.email });
    return { accessToken, email: admin.email };
  }
}
