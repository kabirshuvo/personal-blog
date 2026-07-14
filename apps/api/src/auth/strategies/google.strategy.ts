import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      done(new Error('Google account has no email'), false);
      return;
    }

    try {
      const user = await this.authService.validateOAuthUser({
        provider: 'google',
        providerId: profile.id,
        email,
        name: profile.displayName || email.split('@')[0],
        avatarUrl: profile.photos?.[0]?.value ?? null,
      });
      done(null, user);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
