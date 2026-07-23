import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class TokenBlacklistGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未提供认证令牌');
    }
    const token = authHeader.substring(7);
    if (this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('令牌已失效');
    }
    return true;
  }
}

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private blacklistGuard: TokenBlacklistGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.blacklistGuard.canActivate(context);
    // JwtAuthGuard.canActivate returns Promise<boolean> in NestJS
    const result = await this.jwtAuthGuard.canActivate(context);
    if (result instanceof Observable) {
      return result.toPromise() as Promise<boolean>;
    }
    return result as boolean;
  }
}
