import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

// userId/driverId no longer accepted from the client — both controller
// actions derive identity from the authenticated JWT (see UserJwtGuard).
export class TopUpDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  customerEmail: string;
}

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}
