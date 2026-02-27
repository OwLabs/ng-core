import { MaterialType } from 'src/modules/materials/domain/enums';

/**
 * UploadMaterialCommand — the "envelope" for an upload request
 *
 * WHAT IS A COMMAND?
 *   A command is a DATA OBJECT that describes an intention:
 *   "I want to upload this material with these properties."
 *
 *   It carries NO logic — just data. The handler does the work.
 *
 * WHY NOT JUST PASS THE DTO?
 *   DTOs are HTTP-layer concerns (validation decorators, class-validator).
 *   Commands are APPLICATION-layer concerns (pure data).
 *   The controller converts DTO → Command, stripping HTTP specifics.
 *
 * FLOW:
 *   Controller receives DTO
 *     → creates UploadMaterialCommand
 *     → sends to CommandBus
 *     → CommandBus finds UploadMaterialHandler
 *     → handler.execute(command)
 *
 * SAME PATTERN AS: CreateUserCommand in users/application/commands/
 */
export class UploadMaterialCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly type: MaterialType,
    public readonly subject: string,
    public readonly topic: string,
    public readonly uploadedBy: string,
    public readonly assignedTo: string[],
    public readonly fileUrl?: string,
    public readonly fileSize?: number,
    public readonly mimeType?: string,
    public readonly originalName?: string,
    public readonly courseId?: string,
  ) {}
}
