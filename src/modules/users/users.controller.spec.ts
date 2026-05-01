import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';

jest.mock('./users.service', () => ({
  UsersService: class UsersService {},
}));

jest.mock('../organisations/organisation-access.service', () => ({
  OrganisationAccessService: class OrganisationAccessService {},
}));

describe('UsersController', () => {
  const usersService = {
    update: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    findAllInSharedOrganisations: jest.fn(),
  };
  const organisationAccess = {
    sharesOrganisationWith: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(
      usersService as never,
      organisationAccess as never,
    );
  });

  describe('update', () => {
    it('allows self-update of own profile', async () => {
      await controller.update('user-1', { name: 'Jane' }, 'user-1');

      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        name: 'Jane',
      });
    });

    it('blocks updating another user', () => {
      expect(() =>
        controller.update('user-2', { name: 'Jane' }, 'user-1'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('allows fetching own user without org check', async () => {
      await controller.findOne('user-1', 'user-1');

      expect(organisationAccess.sharesOrganisationWith).not.toHaveBeenCalled();
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    });

    it('allows fetching a user that shares an organisation', async () => {
      organisationAccess.sharesOrganisationWith.mockResolvedValue(true);

      await controller.findOne('user-2', 'user-1');

      expect(organisationAccess.sharesOrganisationWith).toHaveBeenCalledWith(
        'user-1',
        'user-2',
      );
      expect(usersService.findOne).toHaveBeenCalledWith('user-2');
    });

    it('blocks fetching a user that does not share an organisation', async () => {
      organisationAccess.sharesOrganisationWith.mockResolvedValue(false);

      await expect(controller.findOne('user-2', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(usersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('allows self-delete', async () => {
      await controller.remove('user-1', 'user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });

    it('blocks deleting another user', () => {
      expect(() => controller.remove('user-2', 'user-1')).toThrow(
        ForbiddenException,
      );
    });
  });
});
