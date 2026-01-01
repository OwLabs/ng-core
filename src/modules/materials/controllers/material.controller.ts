import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from 'src/api';
import { RoleEnum, Roles } from 'src/common/decorators';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UploadMaterialDto } from '../dto';
import { MaterialService } from '../services';
import { MaterialEntity } from 'src/core/domain/entities';
import { Response } from 'express';

@ApiTags('Material')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'material', version: ApiVersionEnum.V1 })
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.TUTOR)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMaterialDto,
    @Req() req,
  ): Promise<MaterialEntity> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.materialService.uploadMaterial({
      ...dto,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadedBy: req.user.userId,
    });
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.TUTOR, RoleEnum.STUDENT)
  @Get()
  async getAll(): Promise<MaterialEntity[]> {
    return this.materialService.getAllMaterials();
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.TUTOR, RoleEnum.STUDENT)
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<MaterialEntity> {
    return this.materialService.getMaterialById(id);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.TUTOR, RoleEnum.STUDENT)
  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { path, filename } = await this.materialService.downloadMaterial(id);
    return res.download(path, filename);
  }
}
