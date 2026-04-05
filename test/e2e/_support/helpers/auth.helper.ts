import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { apiEndpoint } from '../setup/e2e-app.helper';
import { ApiVersionEnum } from 'src/common/config';
import { ACTIONS, TOPICS } from '../constants';
import {
  EMAIL_SERVICE,
  IEmailService,
} from 'src/modules/auth/domain/repositories';
import { AUTH_COOKIE_NAMES } from 'src/modules/auth/domain/constants';
import { parseCookieValue } from '../utils';
import { UserRole } from 'src/modules/users/domain/enums';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateUserRolesCommand } from 'src/modules/users/application/commands/impl';

export interface RegisterAndLoginResult {
  accessToken: string;
  refreshToken: string;
}

export async function registerAndLogin(
  app: INestApplication,
  user: { email: string; name: string; password: string },
  role?: UserRole,
): Promise<RegisterAndLoginResult> {
  const emailService = app.get<IEmailService>(EMAIL_SERVICE);
  const emailSpy = jest.spyOn(emailService, 'sendOtpEmail');

  // 1. Register
  const { body: registerRes } = await request(app.getHttpServer())
    .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.REGISTER))
    .send(user)
    .expect(201);

  // 2. Capture OTP from the spy
  //    Register calls generateAndSendOtp → sendOtpEmail(email, code)
  //    mock.calls[0][1] = second argument of the first call = the plaintext code
  const otpTokenId = registerRes.data.otpTokenId;
  const capturedCode = emailSpy.mock.calls[0][1];

  // 3. Verify OTP
  await request(app.getHttpServer())
    .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.VERIFY_OTP))
    .send({ otpTokenId, code: capturedCode })
    .expect(200);

  // 4. Login
  let loginRes = await request(app.getHttpServer())
    .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
    .send({ email: user.email, password: user.password })
    .set('User-Agent', 'e2e-test-agent/1.0')
    .expect(200);

  // 5. If role provided, update and re-login for fresh token
  if (role) {
    const commandBus = app.get(CommandBus);
    await commandBus.execute(
      new UpdateUserRolesCommand(registerRes.data.user.id, [role]),
    );

    // 6. Re-login to get token with updated roles
    loginRes = await request(app.getHttpServer())
      .post(apiEndpoint(ApiVersionEnum.V1, TOPICS.AUTH, ACTIONS.LOGIN))
      .send({ email: user.email, password: user.password })
      .set('User-Agent', 'e2e-test-agent/1.0')
      .expect(200);
  }

  // 7. Extract tokens from Set-Cookie header (not from response body)
  const cookies = loginRes.headers['set-cookie'] as unknown as string[];
  const accessToken = parseCookieValue(cookies, AUTH_COOKIE_NAMES.ACCESS_TOKEN);
  const refreshToken = parseCookieValue(
    cookies,
    AUTH_COOKIE_NAMES.REFRESH_TOKEN,
  );

  // 8. Clean up spy
  emailSpy.mockRestore();

  return {
    accessToken: accessToken!,
    refreshToken: refreshToken!,
  };
}
