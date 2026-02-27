import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/common/config';
import { Roles } from 'src/common/decorators';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRole } from 'src/modules/users/domain/enums';
import { UploadMaterialDto } from '../../dto';
import { UserExpressRequest } from 'src/common/types';
import { MaterialResponse } from '../../domain/types';
import {
  DeleteMaterialCommand,
  UploadMaterialCommand,
} from '../../application/commands/impl';
import {
  GetAllMaterialsQuery,
  GetMaterialByIdQuery,
  GetStudentMaterialsQuery,
} from '../../application/queries/impl';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

/**
 * MaterialController — 6 endpoints
 *
 * KEY DIFFERENCE FROM MY OLD CONTROLLER:
 *   Old: Controller → Service (direct call)
 *   New: Controller → CommandBus/QueryBus → Handler (decoupled)
 *
 *   The controller doesn't know WHO handles the command.
 *   It just sends it to the bus. NestJS CQRS routes it automatically.
 *
 * NOTICE: Constructor injects CommandBus and QueryBus, NOT the service.
 *   This is the key architectural change.
 *
 * NOTICE: Return type is MaterialResponse (not MaterialEntity).
 *   The handler calls entity.toResponse() before returning.
 */
@ApiTags('Material')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'material', version: ApiVersionEnum.V1 })
export class MaterialController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /material/upload — Upload & assign
   *
   * FLOW:
   *   1. FileInterceptor handles multipart file upload
   *   2. ValidationPipe validates the DTO
   *   3. Controller creates UploadMaterialCommand
   *   4. CommandBus routes to UploadMaterialHandler
   *   5. Handler creates entity, saves, publishes event, returns response
   */
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMaterialDto,
    @Req() req: UserExpressRequest,
  ): Promise<MaterialResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.commandBus.execute(
      new UploadMaterialCommand(
        dto.title,
        dto.description ?? '',
        dto.type,
        dto.subject,
        dto.topic,
        req.user.userId,
        dto.assignedTo ?? [],
        `/uploads/${file.filename}`,
        file.size,
        file.mimetype,
        file.originalname,
        dto.courseId,
      ),
    );
  }

  /**
   * GET /material — List all materials (tutor view)
   *
   * Supports:
   *   ?search=algebra     → text search on title + topic
   *   ?subject=Math       → filter by subject
   *   ?search=x&subject=y → both combined
   */
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('subject') subject?: string,
  ): Promise<MaterialResponse[]> {
    return this.queryBus.execute(new GetAllMaterialsQuery(search, subject));
  }

  /**
   * GET /material/my-materials — Student's assigned materials
   *
   * Uses req.user.userId from JWT to fetch only materials
   * assigned to this student.
   *
   * IMPORTANT: This route MUST be declared BEFORE /:id
   * otherwise NestJS interprets "my-materials" as an :id parameter.
   */
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @Get('my-materials')
  async getMyMaterials(
    @Req() req: UserExpressRequest,
  ): Promise<MaterialResponse[]> {
    return this.queryBus.execute(new GetStudentMaterialsQuery(req.user.userId));
  }

  /**
   * GET /material/:id — Single material (view modal)
   */
  @Roles(UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT)
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<MaterialResponse> {
    return this.queryBus.execute(new GetMaterialByIdQuery(id));
  }

  /**
   * GET /material/download/:id — Download file
   *
   * WHY NOT A QUERY?
   *   This doesn't go through QueryBus because it's not returning
   *   JSON data — it's streaming a file. The controller handles
   *   this directly using res.download().
   *
   *   In the future, we could add a DownloadMaterialCommand
   *   that tracks download counts per student.
   */
  @Roles(UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT)
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const material = await this.queryBus.execute(new GetMaterialByIdQuery(id));

    if (!material.fileUrl) {
      throw new BadRequestException(
        'File location not found for this material',
      );
    }

    const filePath = path.join(process.cwd(), material.fileUrl);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File does not exist on server');
    }

    return res.download(
      filePath,
      material.originalName ?? path.basename(filePath),
    );
  }

  /**
   * DELETE /material/:id — Delete material
   *
   * Only tutors and admins can delete.
   * Handler removes from DB AND cleans up the file from disk.
   */
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteMaterialCommand(id));
    return { message: 'Material deleted successfully' };
  }
}
