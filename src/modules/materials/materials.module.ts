import { Module } from '@nestjs/common';
import {
  DeleteMaterialHandler,
  UploadMaterialHandler,
} from './application/commands/handlers';
import {
  GetAllMaterialsHandler,
  GetMaterialByIdHandler,
  GetStudentMaterialsHandler,
} from './application/queries/handlers';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Material, MaterialSchema } from './infrastructure/schemas';
import { MulterModule } from '@nestjs/platform-express';
import { MaterialController } from './presentation/controllers';
import { MATERIAL_REPOSITORY } from './domain/repositories';
import { MaterialRepositoryImpl } from './infrastructure/repositories';

const CommandHandlers = [UploadMaterialHandler, DeleteMaterialHandler];
const QueryHandlers = [
  GetAllMaterialsHandler,
  GetMaterialByIdHandler,
  GetStudentMaterialsHandler,
];

/**
 * MaterialModule — rewired with CQRS
 *
 * KEY CHANGES FROM OLD VERSION:
 *   1. Imports CqrsModule (for CommandBus/QueryBus)
 *   2. Registers schema LOCALLY (not via DatabaseModule)
 *   3. Uses MATERIAL_REPOSITORY Symbol token for DI
 *   4. Registers command/query handlers (not a service)
 *   5. Controller is from presentation/ (not controllers/)
 *
 * COMPARE WITH OLD:
 *   Old: imports: [DatabaseModule, MulterModule]
 *   Old: providers: [MaterialService, MaterialRepository]
 *
 *   New: imports: [CqrsModule, MongooseModule.forFeature(), MulterModule]
 *   New: providers: [...Handlers, { provide: MATERIAL_REPOSITORY, useClass: ... }]
 *
 * WHY NO MORE DatabaseModule IMPORT?
 *   DatabaseModule used to register the Material schema AND provide
 *   the MongoDB connection. Now materials registers its own schema,
 *   and gets the connection through the global MongooseModule.forRoot()
 *   in DatabaseModule (which AppModule imports).
 *
 * WAIT — BUT WE REMOVED DatabaseModule FROM IMPORTS?
 *   Yes! MongooseModule.forRoot() in DatabaseModule is global.
 *   Once AppModule imports DatabaseModule, ALL modules can use
 *   MongooseModule.forFeature() without re-importing DatabaseModule.
 */
@Module({
  imports: [
    CqrsModule,
    //  Register Material schema locally (materials owns it)
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
    ]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  ],
  controllers: [MaterialController],
  providers: [
    // CQRS handlers
    ...CommandHandlers,
    ...QueryHandlers,

    // Repository - interface token → concrete implementation
    {
      provide: MATERIAL_REPOSITORY,
      useClass: MaterialRepositoryImpl,
    },
  ],
  exports: [CqrsModule],
})
export class MaterialModule {}
