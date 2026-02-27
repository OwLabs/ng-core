/**
 * MaterialUploadedEvent — published after successful upload
 *
 * WHAT IS A DOMAIN EVENT?
 *   "Something happened that other parts of the system might care about."
 *
 *   The Materials module says: "Hey, a material was uploaded!"
 *   It does NOT say: "Hey, send a notification to these students!"
 *   That's the Notifications module's job — IF it chooses to listen.
 *
 * WHY THIS MATTERS:
 *   Without events:
 *     UploadHandler → NotificationService.send()  ← TIGHT COUPLING
 *     Materials knows about Notifications
 *
 *   With events:
 *     UploadHandler → EventBus.publish(MaterialUploadedEvent)
 *     NotificationHandler listens → sends notification
 *     Materials has NO IDEA notifications exist
 *
 * FUTURE USAGE (in a NotificationsModule):
 *   @EventsHandler(MaterialUploadedEvent)
 *   export class MaterialUploadedNotificationHandler
 *     implements IEventHandler<MaterialUploadedEvent>
 *   {
 *     handle(event: MaterialUploadedEvent) {
 *       // Push notification to each student in event.assignedStudentIds
 *     }
 *   }
 */
export class MaterialUploadedEvent {
  constructor(
    public readonly materialId: string,
    public readonly title: string,
    public readonly uploadedBy: string,
    public readonly assignedStudentIds: string[],
  ) {}
}
