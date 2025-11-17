import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  getConnection(): Connection {
    return this.connection;
  }

  async onModuleInit() {
    this.logger.log(`Connected to MongoDB: ${this.connection.name}`);
  }
}
