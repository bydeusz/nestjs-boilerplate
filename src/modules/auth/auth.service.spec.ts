import { ForbiddenException } from '@nestjs/common';
import { comparePassword, hashPassword } from '../../common/utils';
import { AuthService } from './auth.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AuthService', () => {
  const configService = {
    get: jest.fn(),
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

  it('stores a hashed temporary password and marks force-change', async () => {
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
    );
    expect(queueService.addMailJob).toHaveBeenCalledTimes(1);

    const updatePasswordCalls = usersService.updatePassword.mock
      .calls as Array<[string, string, boolean]>;
    const addMailJobCalls = queueService.addMailJob.mock.calls as Array<
      [string, { context: { temporaryPassword: string } }]
    >;
    const passwordHash = updatePasswordCalls[0][1];
    const temporaryPassword =
      addMailJobCalls[0][1].context.temporaryPassword;

    expect(passwordHash).not.toBe(temporaryPassword);
    await expect(
      comparePassword(temporaryPassword, passwordHash),
    ).resolves.toBe(true);
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
});
