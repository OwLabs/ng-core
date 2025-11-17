import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleEnum } from '../decorators';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;
  let spyReflector: jest.SpyInstance;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    spyReflector = jest.spyOn(reflector, 'getAllAndOverride');
  });

  function mockContext(roles: RoleEnum[]) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles },
        }),
      }),
      getHandler: () => {},
      getClass: () => {},
    } as any;
  }

  it('should allow access if no roles required', () => {
    spyReflector.mockReturnValue(undefined);

    const result = guard.canActivate(mockContext([RoleEnum.ADMIN]));
    expect(result).toBeTruthy();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });

  it('should allow access when role matches', () => {
    spyReflector.mockReturnValue([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN]);

    const result = guard.canActivate(mockContext([RoleEnum.ADMIN]));
    expect(result).toBeTruthy();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });

  it('should deny access when role does not match', () => {
    spyReflector.mockReturnValue([RoleEnum.STUDENT, RoleEnum.PARENT]);

    expect(() => guard.canActivate(mockContext([RoleEnum.TUTOR]))).toThrow();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });
});
