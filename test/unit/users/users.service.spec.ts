import { UserRepository } from 'src/core/infrastructure/repositories';
import { UsersService } from 'src/modules/users/services';

describe('UserService (Unit)', () => {
  let usersService: UsersService;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
    } as any;

    usersService = new UsersService(userRepo);
  });

  it('should return user by ID', async () => {
    (userRepo.findById as jest.Mock).mockResolvedValue({
      id: '123',
      email: 'test@example.com',
      name: 'test user',
      provider: 'local',
      roles: ['user'],
    });

    const result = await usersService.findById('123');
    expect(result).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'test user',
      provider: 'local',
      roles: ['user'],
    });
  });

  it('should return null if user is not found', async () => {
    (userRepo.findById as jest.Mock).mockResolvedValue(null);
    const result = await usersService.findById('123');
    expect(result).toBeNull();
  });
});
