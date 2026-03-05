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
});
