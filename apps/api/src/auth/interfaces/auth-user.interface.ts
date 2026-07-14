export type AuthUser = {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
};

export type JwtAccessPayload = AuthUser;

export type JwtRefreshPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
};
