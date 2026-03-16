import { AuthController } from './auth.controller';

jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    requestNewPassword: jest.fn().mockResolvedValue({
      message:
        'If an account exists for this email, a new password has been sent.',
    }),
    resetPassword: jest.fn().mockResolvedValue({
      message: 'Password has been reset successfully.',
    }),
    getCurrentUser: jest.fn().mockResolvedValue({
      id: 'user-1',
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      isAdmin: false,
      isActive: true,
      organisationIds: ['org-1'],
      avatarUrl: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    }),
  };
  const configService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(
      authService as never,
      configService as never,
    );
  });

  it('delegates public request-new-password call to auth service', async () => {
    const result = await controller.requestNewPassword({
      email: 'john@example.com',
    });

    expect(authService.requestNewPassword).toHaveBeenCalledWith(
      'john@example.com',
    );
    expect(result).toEqual({
      message:
        'If an account exists for this email, a new password has been sent.',
    });
  });

  it('returns current authenticated user data', async () => {
    const result = await controller.me('user-1');

    expect(authService.getCurrentUser).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({
      id: 'user-1',
      email: 'john@example.com',
      isAdmin: false,
      isActive: true,
    });
  });

  it('delegates reset-password call to auth service', async () => {
    const result = await controller.resetPassword({
      email: 'john@example.com',
      temporaryPassword: 'TempSecret123!',
      newPassword: 'NewSecret123!',
    });

    expect(authService.resetPassword).toHaveBeenCalledWith(
      'john@example.com',
      'TempSecret123!',
      'NewSecret123!',
    );
    expect(result).toEqual({
      message: 'Password has been reset successfully.',
    });
  });
});
