import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { SetKycStatusDto } from './dto/users.dto';

// Account creation/sign-in lives in AuthController (/auth/*) — gated behind
// OTP verification. This controller only handles post-account admin actions.
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('drivers/:id/kyc')
  setKycStatus(@Param('id') id: string, @Body() body: SetKycStatusDto) {
    return this.usersService.setKycStatus(id, body.status);
  }

  @Delete(':id')
  deleteAccount(@Param('id') id: string) {
    return this.usersService.deleteAccount(id);
  }
}
