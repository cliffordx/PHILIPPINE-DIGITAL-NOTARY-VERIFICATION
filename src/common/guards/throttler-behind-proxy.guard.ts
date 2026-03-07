import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const forwardedIps = req.ips;
    if (Array.isArray(forwardedIps) && forwardedIps.length > 0) {
      return String(forwardedIps[0]);
    }

    return String(req.ip ?? 'unknown');
  }
}