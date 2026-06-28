import { LogLevel, type OpenIdConfiguration } from 'angular-auth-oidc-client';

export const authConfig: OpenIdConfiguration = {
  authority: 'http://localhost:8080/realms/wardrobe',
  redirectUrl: `${window.location.origin}/login`,
  postLogoutRedirectUri: `${window.location.origin}/login`,
  clientId: 'wardrobe-frontend',
  scope: 'openid profile email',
  responseType: 'code',
  silentRenew: true,
  useRefreshToken: true,
  ignoreNonceAfterRefresh: true,
  renewTimeBeforeTokenExpiresInSeconds: 30,
  autoUserInfo: true,
  unauthorizedRoute: '/login',
  forbiddenRoute: '/login',
  logLevel: LogLevel.Warn,
};
