import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ??
        'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email =
      profile.emails?.[0]?.value ??
      `${profile.username ?? profile.id}@users.noreply.github.com`;

    return this.authService.validateOAuthUser({
      provider: 'github',
      providerId: profile.id,
      email,
      name: profile.displayName || profile.username || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}
