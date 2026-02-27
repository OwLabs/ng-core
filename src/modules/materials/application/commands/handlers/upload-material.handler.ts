import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UploadMaterialCommand } from '../impl';
import { Inject } from '@nestjs/common';
import {
  IMaterialRepository,
  MATERIAL_REPOSITORY,
} from 'src/modules/materials/domain/repositories';
import { MaterialResponse } from 'src/modules/materials/domain/types';
import { Material } from 'src/modules/materials/domain/entities';

/**
 * UploadMaterialHandler — executes the upload command
 *
 * WHAT IS A COMMAND HANDLER?
 *   The handler is WHERE THE WORK HAPPENS. It receives the
 *   command (data) and performs the operation:
 *   1. Create the entity using the factory method
 *   2. Save to database via repository
 *   3. Publish domain event for other modules
 *   4. Return the response
 *
 * WHY PUBLISH AN EVENT?
 *   So the Notifications module (future) can react to uploads
 *   WITHOUT materials knowing about notifications.
 *
 * SAME PATTERN AS: CreateUserHandler in users/application/
 *
 * @Inject(MATERIAL_REPOSITORY):
 *   Uses the Symbol token to get the concrete repo.
 *   The handler doesn't know or care if it's MongoDB, PostgreSQL,
 *   or a mock for testing. It just calls save().
 */
@CommandHandler(UploadMaterialCommand)
export class UploadMaterialHandler
  implements ICommandHandler<UploadMaterialCommand>
{
  constructor(
    @Inject(MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UploadMaterialCommand): Promise<MaterialResponse> {
    // 1. Create domain entity using factory method
    const material = Material.create({
      title: command.title,
      description: command.description,
      type: command.type,
      subject: command.subject,
      topic: command.topic,
      fileUrl: command.fileUrl,
      fileSize: command.fileSize,
      mimeType: command.mimeType,
      originalName: command.originalName,
      uploadedBy: command.uploadedBy,
      assignedTo: command.assignedTo,
      courseId: command.courseId,
    });

    // 2. Save to database
    const saved = await this.materialRepository.save(material);

    // 3. Publish domain event () notifications)
    // this.eventBus.publish(
    //   new MaterialUploadedEvent(
    //     saved.id,
    //     saved.title,
    //     saved.uploadedBy,
    //     saved.assignedTo,
    //   ),
    // );

    // 4. Return API response (not the entity)
    return saved.toResponse();
  }
}
