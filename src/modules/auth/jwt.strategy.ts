import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    ibpNumber: string;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      ibpNumber: payload.ibpNumber,
    };
  }
}