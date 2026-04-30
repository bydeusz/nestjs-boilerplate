import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { comparePassword, hashPassword } from '../../common/utils';
import { AuthService } from './auth.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AuthService', () => {
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'auth.allowedEmailDomains') {
        return ['example.com'];
      }
      return defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'jwt.refreshExpiration') {
        return '7d';
      }
      if (key === 'jwt.refreshSecret') {
        return 'test-refresh-secret';
      }

      throw new Error(`Unknown config key: ${key}`);
    }),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };
  const prisma = {
    refreshToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    activationCode: {
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    emailChangeRequest: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
    createFromRegistration: jest.fn(),
  };
  const queueService = {
    addMailJob: jest.fn().mockResolvedValue(undefined),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      configService as never,
      jwtService as never,
      prisma as never,
      usersService as never,
      queueService as never,
    );
  });

  it('returns a generic message when user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.requestNewPassword('unknown@example.com'),
    ).resolves.toEqual({
      message:
        'If an account exists for this email, a new password has been sent.',
    });

    expect(usersService.updatePassword).not.toHaveBeenCalled();
    expect(queueService.addMailJob).not.toHaveBeenCalled();
  });

  it('stores a hashed temporary password, adds expiration and reset URL', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
    });
    usersService.updatePassword.mockResolvedValue(undefined);

    await service.requestNewPassword('john@example.com');

    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      true,
      expect.any(Date),
    );
    expect(queueService.addMailJob).toHaveBeenCalledTimes(1);

    const updatePasswordCalls = usersService.updatePassword.mock
      .calls as Array<[string, string, boolean]>;
    const addMailJobCalls = queueService.addMailJob.mock.calls as Array<
      [string, { context: { temporaryPassword: string; resetUrl: string } }]
    >;
    const passwordHash = updatePasswordCalls[0][1];
    const temporaryPassword =
      addMailJobCalls[0][1].context.temporaryPassword;

    expect(passwordHash).not.toBe(temporaryPassword);
    await expect(
      comparePassword(temporaryPassword, passwordHash),
    ).resolves.toBe(true);
    expect(addMailJobCalls[0][1].context.resetUrl).toBe(
      'http://localhost:3000/reset-password/confirm?email=john%40example.com',
    );
  });

  it('blocks login when mustChangePassword is true', async () => {
    const hashedPassword = await hashPassword('Secret123!');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      isAdmin: false,
      isActive: true,
      mustChangePassword: true,
      password: hashedPassword,
    });

    await expect(
      service.login({ email: 'john@example.com', password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resets mustChangePassword flag after changing password', async () => {
    const hashedPassword = await hashPassword('OldSecret123!');
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      isAdmin: false,
      password: hashedPassword,
    });
    usersService.updatePassword.mockResolvedValue(undefined);
    jest.spyOn(service, 'generateTokens').mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    await service.changePassword('user-1', 'OldSecret123!', 'NewSecret123!');

    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      false,
    );
  });

  it('sends activation mail with email-only verify URL on register', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createFromRegistration.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
    });
    prisma.activationCode.deleteMany.mockResolvedValue({ count: 0 });
    prisma.activationCode.create.mockResolvedValue({
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await service.register({
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      password: 'Secret123!',
    });

    expect(queueService.addMailJob).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        template: 'activation-code',
        context: expect.objectContaining({
          code: '123456',
          activationUrl: 'http://localhost:3000/verify?email=john%40example.com',
        }),
      }),
    );
  });

  it('resets password with a valid temporary password', async () => {
    const hashedTemporaryPassword = await hashPassword('TempSecret123!');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      isActive: false,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      password: hashedTemporaryPassword,
    });
    usersService.updatePassword.mockResolvedValue(undefined);
    prisma.user.update.mockResolvedValue(undefined);

    await expect(
      service.resetPassword(
        'john@example.com',
        'TempSecret123!',
        'NewSecret123!',
      ),
    ).resolves.toEqual({ message: 'Password has been reset successfully.' });

    expect(usersService.updatePassword).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      false,
      null,
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: true },
    });
  });

  it('rejects reset when temporary password has expired', async () => {
    const hashedTemporaryPassword = await hashPassword('TempSecret123!');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() - 1),
      password: hashedTemporaryPassword,
    });

    await expect(
      service.resetPassword(
        'john@example.com',
        'TempSecret123!',
        'NewSecret123!',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reset when temporary password is invalid', async () => {
    const hashedTemporaryPassword = await hashPassword('TempSecret123!');
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      password: hashedTemporaryPassword,
    });

    await expect(
      service.resetPassword('john@example.com', 'WrongTemp123!', 'NewSecret123!'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('requestEmailChange', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
    };

    it('rejects when new email matches the current one', async () => {
      usersService.findById.mockResolvedValue(currentUser);

      await expect(
        service.requestEmailChange('user-1', 'john@example.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.emailChangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects when new email domain is not allowed', async () => {
      usersService.findById.mockResolvedValue(currentUser);

      await expect(
        service.requestEmailChange('user-1', 'jane@notallowed.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.emailChangeRequest.create).not.toHaveBeenCalled();
    });

    it('rejects when new email is already taken', async () => {
      usersService.findById.mockResolvedValue(currentUser);
      usersService.findByEmail.mockResolvedValue({ id: 'user-2' });

      await expect(
        service.requestEmailChange('user-1', 'taken@example.com'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.emailChangeRequest.create).not.toHaveBeenCalled();
    });

    it('creates a request and sends mail to both old and new address', async () => {
      usersService.findById.mockResolvedValue(currentUser);
      usersService.findByEmail.mockResolvedValue(null);
      prisma.emailChangeRequest.create.mockResolvedValue({});

      await service.requestEmailChange('user-1', 'New@Example.com');

      expect(prisma.emailChangeRequest.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.emailChangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            newEmail: 'new@example.com',
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );

      const recipients = (queueService.addMailJob.mock.calls as Array<
        [string, { to: string; template: string }]
      >).map(([, payload]) => ({
        to: payload.to,
        template: payload.template,
      }));

      expect(recipients).toEqual(
        expect.arrayContaining([
          { to: 'new@example.com', template: 'email-change-confirmation' },
          { to: 'john@example.com', template: 'email-change-notice' },
        ]),
      );
    });
  });

  describe('confirmEmailChange', () => {
    it('rejects an unknown token', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue(null);

      await expect(service.confirmEmailChange('bad')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an expired token and deletes the request', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        token: 'tok',
        userId: 'user-1',
        newEmail: 'new@example.com',
        expiresAt: new Date(Date.now() - 1),
        user: { id: 'user-1', email: 'old@example.com' },
      });

      await expect(service.confirmEmailChange('tok')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.emailChangeRequest.delete).toHaveBeenCalledWith({
        where: { id: 'req-1' },
      });
    });

    it('updates the email and revokes tokens on success', async () => {
      prisma.emailChangeRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        token: 'tok',
        userId: 'user-1',
        newEmail: 'new@example.com',
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', email: 'old@example.com' },
      });
      usersService.findByEmail.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([]);

      await expect(service.confirmEmailChange('tok')).resolves.toEqual({
        message: 'Email address has been updated. Please sign in again.',
      });

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
