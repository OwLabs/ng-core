import { User } from 'src/modules/users/domain/entities';
import { AuthProvider, UserRole } from 'src/modules/users/domain/enums';
import { Email, UserName } from 'src/modules/users/domain/value-objects';

let user: User;

const createUserFunc = (overrides = {}) => {
  return User.create({
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    provider: AuthProvider.LOCAL,
    avatar: 'pikachu',
    ...overrides,
  });
};

const advanceTime = (date: string) => {
  jest.setSystemTime(new Date(date));
};

beforeEach(() => {
  jest.useFakeTimers();
  advanceTime('2026-03-07');
  user = createUserFunc();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('User Entity', () => {
  describe('create()', () => {
    it('should create a user with default role', () => {
      expect(user.id).toBeDefined();
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name.getValue()).toBe('Test User');
      expect(user.provider).toBe(AuthProvider.LOCAL);
      expect(user.roles).toEqual([UserRole.LIMITED_ACCESS_USER]);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should reject invalid email', () => {
      expect(() => Email.create('invalid-email')).toThrow();
    });
  });

  describe('updateRoles()', () => {
    it('should update roles', () => {
      const oldUpdatedAt = user.updatedAt;
      advanceTime('2026-03-08');

      user.updateRoles([UserRole.ADMIN, UserRole.TUTOR]);
      expect(user.roles).toHaveLength(2);
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('should reject empty roles', () => {
      expect(() => user.updateRoles([])).toThrow(
        'User must have at least one role',
      );
    });

    describe('changeName()', () => {
      it('should change user name', () => {
        const oldUpdatedAt = user.updatedAt;
        advanceTime('2026-03-08');

        const newName = UserName.create('New user name here');
        user.changeName(newName);

        expect(user.name.getValue()).toBe('New user name here');
        expect(user.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      });
    });

    describe('changeEmail()', () => {
      it('should change user email', () => {
        const oldUpdatedAt = user.updatedAt;
        advanceTime('2026-03-08');

        const newEmail = Email.create('email@email.com');
        user.changeEmail(newEmail);

        expect(user.email.getValue()).toBe('email@email.com');
        expect(user.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      });
    });

    describe('updateAvatar()', () => {
      it('should change user avatar if avatar exist', () => {
        const oldUpdatedAt = user.updatedAt;
        advanceTime('2026-03-08');

        const newAvatar = 'snorlax';

        user.updateAvatar(newAvatar);

        expect(user.avatar).toBe('snorlax');
        expect(user.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      });

      it('should return null for no avatar', () => {
        const oldUpdatedAt = user.updatedAt;
        advanceTime('2026-03-08');

        expect(user.updateAvatar(null)).toBeUndefined();
        expect(user.avatar).toBeNull();
        expect(user.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      });
    });

    describe('hasRole()', () => {
      it('should return true if user has the role', () => {
        user.updateRoles([UserRole.ADMIN, UserRole.TUTOR]);

        expect(user.hasRole(UserRole.ADMIN)).toBe(true);
      });

      it('should return false if user does not have the role', () => {
        user.updateRoles([UserRole.TUTOR]);

        expect(user.hasRole(UserRole.ADMIN)).toBe(false);
      });
    });

    describe('isAdmin()', () => {
      it('should return true if user is ADMIN', () => {
        user.updateRoles([UserRole.ADMIN]);

        expect(user.isAdmin()).toBe(true);
      });

      it('should return true if user is SUPER_ADMIN', () => {
        user.updateRoles([UserRole.SUPER_ADMIN]);

        expect(user.isAdmin()).toBe(true);
      });

      it('should return false if user is not admin', () => {
        user.updateRoles([UserRole.TUTOR]);

        expect(user.isAdmin()).toBe(false);
      });
    });

    describe('getPasswordHash()', () => {
      it('should return password hash when password exists', () => {
        expect(user.getPasswordHash()).toBe('password123');
      });

      it('should return null for OAuth users without password', () => {
        const oAuthUser = createUserFunc({
          email: 'test@gmail.com',
          name: 'OAuth User',
          password: null,
          provider: AuthProvider.GOOGLE,
          providerId: 'google-123',
        });

        expect(oAuthUser.email.getValue()).toBe('test@gmail.com');
        expect(oAuthUser.getPasswordHash()).toBeNull();
      });
    });

    describe('toResponse()', () => {
      it('should exclude password', () => {
        const response = user.toResponse();

        expect((response as any).password).toBeUndefined();
      });
    });
  });
});
