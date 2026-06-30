import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverKycStatus, User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByPhone(phoneNumber: string) {
    return this.users.findOne({ where: { phoneNumber } });
  }

  /**
   * Sign-up: rejects if the phone number is already registered. Only called
   * from AuthController after OTP verification — see auth.controller.ts.
   */
  async signUpRider(phoneNumber: string, fullName: string) {
    const existing = await this.users.findOne({ where: { phoneNumber, role: UserRole.RIDER } });
    if (existing) throw new BadRequestException('A rider account with this phone number already exists');
    return this.users.save(this.users.create({ phoneNumber, fullName, role: UserRole.RIDER }));
  }

  /** Sign-in: 404s if no account exists for the phone number. */
  async signInRider(phoneNumber: string) {
    const rider = await this.findByPhone(phoneNumber);
    if (!rider || rider.role !== UserRole.RIDER) throw new NotFoundException('No rider account found for this phone number');
    return rider;
  }

  async registerDriver(input: {
    phoneNumber: string;
    fullName: string;
    profilePhotoUrl: string;
    tricyclePlateNumber: string;
    tricyclePlatePhotoUrl: string;
    driverLicenseNumber: string;
    nin: string;
    city: string;
    levyReceiptUrl?: string;
  }) {
    const existing = await this.users.findOne({ where: { phoneNumber: input.phoneNumber, role: UserRole.DRIVER } });
    if (existing) throw new BadRequestException('A driver account with this phone number already exists');
    return this.users.save(
      this.users.create({
        ...input,
        role: UserRole.DRIVER,
        kycStatus: DriverKycStatus.PENDING,
      }),
    );
  }

  /** Sign-in: 404s if no driver account exists for the phone number. */
  async signInDriver(phoneNumber: string) {
    const driver = await this.findByPhone(phoneNumber);
    if (!driver || driver.role !== UserRole.DRIVER) throw new NotFoundException('No driver account found for this phone number');
    return driver;
  }

  /** Admin driver list — optionally filtered by KYC status (e.g. ?status=pending). */
  listDrivers(status?: DriverKycStatus) {
    return this.users.find({
      where: { role: UserRole.DRIVER, ...(status ? { kycStatus: status } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  async setKycStatus(driverId: string, status: DriverKycStatus) {
    const driver = await this.users.findOne({ where: { id: driverId, role: UserRole.DRIVER } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.kycStatus = status;
    return this.users.save(driver);
  }

  /**
   * Account deletion (Apple/Play Store requirement for apps collecting personal
   * data). Hard-deletes the user row. Trips/ledger entries reference the id by
   * plain string column, not a DB foreign key, so they survive as historical
   * records — intentional, since the ledger is an audit trail that must not
   * be rewritten even after the account behind it is gone.
   */
  async deleteAccount(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Account not found');
    await this.users.remove(user);
    return { deleted: true };
  }

  // Trimmed public profile shown to a rider the moment a trip is matched:
  // photo, name, phone, and tricycle plate — nothing else.
  toPublicDriverProfile(driver: User) {
    return {
      id: driver.id,
      fullName: driver.fullName,
      phoneNumber: driver.phoneNumber,
      profilePhotoUrl: driver.profilePhotoUrl,
      tricyclePlateNumber: driver.tricyclePlateNumber,
    };
  }
}
