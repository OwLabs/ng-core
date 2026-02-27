import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';

/**
 * DatabaseModule — CONNECTION ONLY
 *
 * This module's ONLY job is establishing the MongoDB connection.
 * Each feature module registers its own schemas via MongooseModule.forFeature().
 *
 * BEFORE (old):
 *   MongooseModule.forFeature([User, RefreshToken, Material])  ← registered ALL
 *
 * AFTER (clean):
 *   Just forRoot(). Each module handles its own schemas.
 */
@Module({
  imports: [
    // Database CONNECTION — shared by all modules
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
        dbName: process.env.MONGO_DB_NAME,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
