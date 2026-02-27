import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from 'src/modules/users/domain/enums';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;
  let spyReflector: jest.SpyInstance;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    spyReflector = jest.spyOn(reflector, 'getAllAndOverride');
  });

  function mockContext(roles: UserRole[]) {
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

  it('should allow access if no roles required', async () => {
    spyReflector.mockReturnValue(undefined);

    const result = await guard.canActivate(mockContext([UserRole.ADMIN]));
    expect(result).toBeTruthy();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });

  it('should allow access when role matches', async () => {
    spyReflector.mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    const result = await guard.canActivate(mockContext([UserRole.ADMIN]));
    expect(result).toBeTruthy();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });

  it('should deny access when role does not match', async () => {
    spyReflector.mockReturnValue([UserRole.STUDENT, UserRole.PARENT]);

    await expect(
      guard.canActivate(mockContext([UserRole.TUTOR])),
    ).rejects.toThrow();
    expect(spyReflector).toHaveBeenCalledTimes(1);
  });

  it('should drain multipart stream before throwing ForbiddenException or HTTP Status Code 403', async () => {
    spyReflector.mockReturnValue([UserRole.ADMIN]);

    const resumeMock = jest.fn();
    const onMock = jest.fn((event: string, cb: () => void) => {
      // Simulate stream ending immediately
      if (event === 'end') {
        cb();
      }
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles: [UserRole.TUTOR] }, // User does not have required role
          readable: true, // Simulate multipart / stream request
          readableEnded: false,
          resume: resumeMock, // Used to drain the stream
          on: onMock, // Used to listen for 'end' and 'error'
        }),
      }),
      getHandler: () => {},
      getClass: () => {},
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access denied: you do not have permission to access this resource',
    );

    expect(spyReflector).toHaveBeenCalledTimes(1);
    expect(resumeMock).toHaveBeenCalledTimes(1);

    /**
     * Guard registers TWO listeners when draining:
     * 1. 'end'   → resolve when stream finishes normally
     * 2. 'error' → resolve even if stream errors
     */
    expect(onMock).toHaveBeenCalledTimes(2); // consist of 'end' and 'error' function
    expect(onMock).toHaveBeenCalledWith('end', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
