import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes, randomInt, randomUUID } from 'crypto';
import ms, { StringValue } from 'ms';
import { comparePassword, hashPassword } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { MAIL_JOB_SEND, QueueService } from '../queue';
import { UsersService } from '../users/users.service';
import {
  AuthTokensResponseDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
} from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface TokenUser {
  id: string;
  email: string;
  isAdmin: boolean;
  organisationId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly queueService: QueueService,
  ) {}

  async generateTokens(user: TokenUser): Promise<AuthTokensResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      organisationId: user.organisationId,
    };
    const refreshToken = await this.createAndStoreRefreshToken(user.id);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Invalid token subject.');
    }

    return payload;
  }

  async login(loginDto: LoginDto): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not activated. Please check your email.',
      );
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<MessageResponseDto> {
    this.validateEmailDomain(registerDto.email);

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const user = await this.usersService.createFromRegistration(registerDto);
    await this.prisma.activationCode.deleteMany({
      where: { userId: user.id },
    });

    const activationCode = await this.createActivationCode(user.id);
    await this.sendActivationCodeEmail(
      user.email,
      `${user.name} ${user.surname}`.trim(),
      activationCode.code,
    );

    return {
      message:
        'Registration successful. Check your email for an activation code.',
    };
  }

  async activate(email: string, code: string): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid activation code.');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already activated.');
    }

    const now = new Date();
    const activationCode = await this.prisma.activationCode.findFirst({
      where: {
        userId: user.id,
        code,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!activationCode) {
      throw new BadRequestException('Invalid or expired activation code.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      }),
      this.prisma.activationCode.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await this.sendWelcomeEmail(
      user.email,
      `${user.name} ${user.surname}`.trim(),
    );

    return this.generateTokens(user);
  }

  async resendActivationCode(email: string): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already activated.');
    }

    await this.prisma.activationCode.deleteMany({
      where: { userId: user.id },
    });

    const activationCode = await this.createActivationCode(user.id);
    await this.sendActivationCodeEmail(
      user.email,
      `${user.name} ${user.surname}`.trim(),
      activationCode.code,
    );

    return { message: 'A new activation code has been sent to your email.' };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokensResponseDto> {
    const refreshTokenRecord =
      await this.getValidRefreshTokenRecord(refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens({
      id: refreshTokenRecord.user.id,
      email: refreshTokenRecord.user.email,
      isAdmin: refreshTokenRecord.user.isAdmin,
      organisationId: refreshTokenRecord.user.organisationId,
    });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const refreshTokenRecord =
      await this.getValidRefreshTokenRecord(refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.revokeAllUserTokens(userId);
    await this.sendPasswordChangedEmail(
      user.email,
      `${user.name} ${user.surname}`.trim(),
    );

    return this.generateTokens(user);
  }

  private validateEmailDomain(email: string): void {
    const allowedDomains =
      this.configService.get<string[]>('auth.allowedEmailDomains') ?? [];
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain || !allowedDomains.includes(domain)) {
      throw new BadRequestException('Email domain is not allowed.');
    }
  }

  private buildRefreshTokenExpiryDate(): Date {
    const expiration = this.configService.getOrThrow<string>(
      'jwt.refreshExpiration',
    );
    const ttl = ms(expiration as StringValue);

    if (typeof ttl !== 'number') {
      throw new InternalServerErrorException(
        'Invalid refresh token expiration.',
      );
    }

    return new Date(Date.now() + ttl);
  }

  private buildActivationCodeExpiryDate(): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  private generateActivationCode(): string {
    return randomInt(100000, 1_000_000).toString();
  }

  private async createActivationCode(userId: string) {
    return this.prisma.activationCode.create({
      data: {
        userId,
        code: this.generateActivationCode(),
        expiresAt: this.buildActivationCodeExpiryDate(),
      },
    });
  }

  private async sendActivationCodeEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.queueService.addMailJob(MAIL_JOB_SEND, {
      to: email,
      subject: 'Activate your account',
      template: 'activation-code',
      context: {
        name,
        code,
      },
    });
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.queueService.addMailJob(MAIL_JOB_SEND, {
      to: email,
      subject: 'Welcome to the platform',
      template: 'welcome',
      context: {
        name,
      },
    });
  }

  private async sendPasswordChangedEmail(
    email: string,
    name: string,
  ): Promise<void> {
    await this.queueService.addMailJob(MAIL_JOB_SEND, {
      to: email,
      subject: 'Your password was changed',
      template: 'password-changed',
      context: {
        name,
      },
    });
  }

  private parseRefreshToken(refreshToken: string): {
    tokenId: string;
    tokenSecret: string;
    signature: string;
  } {
    const [tokenId, tokenSecret, signature] = refreshToken.split('.');

    if (!tokenId || !tokenSecret || !signature) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return { tokenId, tokenSecret, signature };
  }

  private async createAndStoreRefreshToken(userId: string): Promise<string> {
    const tokenId = randomUUID();
    const tokenSecret = randomBytes(32).toString('hex');
    const hashedTokenSecret = await hashPassword(tokenSecret);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: hashedTokenSecret,
        userId,
        expiresAt: this.buildRefreshTokenExpiryDate(),
      },
    });

    const signature = this.signRefreshTokenValue(tokenId, tokenSecret);
    return `${tokenId}.${tokenSecret}.${signature}`;
  }

  private async getValidRefreshTokenRecord(refreshToken: string) {
    const { tokenId, tokenSecret, signature } =
      this.parseRefreshToken(refreshToken);
    const expectedSignature = this.signRefreshTokenValue(tokenId, tokenSecret);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: {
        user: true,
      },
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (refreshTokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    if (refreshTokenRecord.expiresAt <= new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has expired.');
    }

    const isRefreshTokenValid = await comparePassword(
      tokenSecret,
      refreshTokenRecord.token,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return refreshTokenRecord;
  }

  private signRefreshTokenValue(tokenId: string, tokenSecret: string): string {
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');

    return createHmac('sha256', refreshSecret)
      .update(`${tokenId}.${tokenSecret}`)
      .digest('hex');
  }
}
