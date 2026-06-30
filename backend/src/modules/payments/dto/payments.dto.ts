import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class TopUpDto {
  @IsUUID()
  userId: string;

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
  @IsUUID()
  driverId: string;

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
