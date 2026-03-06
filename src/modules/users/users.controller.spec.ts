import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';

jest.mock('./users.service', () => ({
  UsersService: class UsersService {},
}));

describe('UsersController', () => {
  const usersService = {
    updateAdminRoleForOrganisationUser: jest.fn().mockResolvedValue({
      id: 'target-user',
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      isAdmin: true,
      isActive: true,
      organisationIds: ['org-1'],
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService as never);
  });

  it('allows admin to update isAdmin through patch route', async () => {
    await controller.update(
      'target-user',
      { isAdmin: true },
      'current-user',
      true,
    );

    expect(usersService.updateAdminRoleForOrganisationUser).toHaveBeenCalledWith(
      'target-user',
      'current-user',
      true,
      undefined,
    );
  });

  it('allows admin to update organisationIds through patch route', async () => {
    await controller.update(
      'target-user',
      { organisationIds: ['550e8400-e29b-41d4-a716-446655440000'] },
      'current-user',
      true,
    );

    expect(usersService.updateAdminRoleForOrganisationUser).toHaveBeenCalledWith(
      'target-user',
      'current-user',
      undefined,
      ['550e8400-e29b-41d4-a716-446655440000'],
    );
  });

  it('blocks isAdmin and organisationIds updates for non-admin users', async () => {
    expect(() =>
      controller.update(
        'target-user',
        { isAdmin: true, organisationIds: [] },
        'current-user',
        false,
      ),
    ).toThrow(ForbiddenException);
  });
});
