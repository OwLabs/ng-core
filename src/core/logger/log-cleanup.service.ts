import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogCleanupService implements OnModuleInit {
  private readonly logger = new Logger(LogCleanupService.name);
  private readonly logDir = path.resolve(process.cwd(), 'logs');
  private readonly maxAgeDays = 90; // 3 months

  // Run cleanup on app startup, then every 24 hours
  onModuleInit() {
    this.cleanup();
    setInterval(
      () => this.cleanup(),
      24 * 60 * 60 * 1000, // 24 hours
    );
  }

  private cleanup(): void {
    if (!fs.existsSync(this.logDir)) {
      return;
    }

    const now = Date.now();
    const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;

    const files = fs.readdirSync(this.logDir);

    for (const file of files) {
      if (!file.endsWith('.log')) {
        continue;
      }

      const filePath = path.join(this.logDir, file);

      try {
        const stats = fs.statSync(filePath);
        const fileAgeMs = now - stats.mtimeMs;

        if (fileAgeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          this.logger.log(
            `Deleted expired log file: ${file} (age: ${Math.floor(fileAgeMs / (24 * 60 * 60 * 1000))} days)`,
          );
        }
      } catch (error) {
        this.logger.warn(`Failed to process log file: ${file} — ${error}`);
      }
    }
  }
}
