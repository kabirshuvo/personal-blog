import {
  CanActivate,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class GoogleOAuthConfiguredGuard implements CanActivate {
  canActivate(): boolean {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
    return true;
  }
}

@Injectable()
export class GithubOAuthConfiguredGuard implements CanActivate {
  canActivate(): boolean {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
      );
    }
    return true;
  }
}
