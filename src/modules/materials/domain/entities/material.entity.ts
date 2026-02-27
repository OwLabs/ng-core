/**
 * Material Entity — OOP version
 *
 * SAME PATTERN AS User entity:
 *   - Private fields → getters only (encapsulation)
 *   - Factory methods: create() and fromPersistence()
 *   - Business methods: assignTo(), isAssignedTo()
 *   - toResponse() for API output
 *   - toPersistence() for DB writes
 *
 * WHY TWO FACTORIES?
 *   create()          — for NEW materials (upload). Generates new ObjectId.
 *   fromPersistence()  — for materials LOADED from DB. Uses existing ID.
 *
 *   This is important because when you create a new material,
 *   it doesn't have an ID yet (MongoDB will assign one).
 *   But when you load from DB, it already HAS an ID.
 *
 * WHY PRIVATE FIELDS?
 *   So nobody can do: material.title = 'hacked'
 *   The entity CONTROLS its own data. If you need to change
 *   the title, you'd add a method: material.updateTitle(newTitle)
 *   that can include validation logic.
 */
// ----- Props interfaces (what each factory accepts) -----

import { Types } from 'mongoose';
import { MaterialType } from '../enums';

interface CreateMaterialProps {
  title: string;
  description: string;
  type: MaterialType;
  subject: string;
  topic: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  originalName?: string;
  uploadedBy: string; // string ID (not ObjectId — domain doesn't need Mongoose)
  assignedTo?: string[]; // student user IDs
  courseId?: string;
}

interface MaterialPersistenceProps {
  id: Types.ObjectId;
  title: string;
  description: string;
  type: MaterialType;
  subject: string;
  topic: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  originalName?: string;
  uploadedBy: Types.ObjectId;
  assignedTo: Types.ObjectId[];
  courseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Material {
  // ===== PRIVATE FIELDS =====
  // Nobody outside this class can modify these directly
  private readonly _id: Types.ObjectId;
  private readonly _title: string;
  private readonly _description: string;
  private readonly _type: MaterialType;
  private readonly _subject: string;
  private readonly _topic: string;
  private readonly _fileUrl?: string;
  private readonly _fileSize?: number;
  private readonly _mimeType?: string;
  private readonly _originalName?: string;
  private readonly _uploadedBy: Types.ObjectId;
  private readonly _assignedTo: Types.ObjectId[];
  private readonly _courseId?: string;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  // ===== PRIVATE CONSTRUCTOR =====
  // Forces use of factory methods (create / fromPersistence)
  private constructor(props: MaterialPersistenceProps) {
    this._id = props.id;
    this._title = props.title;
    this._description = props.description;
    this._type = props.type;
    this._subject = props.subject;
    this._topic = props.topic;
    this._fileUrl = props.fileUrl;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._originalName = props.originalName;
    this._uploadedBy = props.uploadedBy;
    this._assignedTo = props.assignedTo;
    this._courseId = props.courseId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ===== GETTERS =====
  // Read-only access to private fields
  get id(): string {
    return this._id.toHexString();
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get type(): MaterialType {
    return this._type;
  }

  get subject(): string {
    return this._subject;
  }

  get topic(): string {
    return this._topic;
  }

  get fileUrl(): string | undefined {
    return this._fileUrl;
  }

  get fileSize(): number | undefined {
    return this._fileSize;
  }

  get mimeType(): string | undefined {
    return this._mimeType;
  }

  get originalName(): string | undefined {
    return this._originalName;
  }

  get uploadedBy(): string {
    return this._uploadedBy.toHexString();
  }

  get assignedTo(): string[] {
    return this._assignedTo.map((id) => id.toHexString());
  }

  get assignedCount(): number {
    return this._assignedTo.length;
  }

  get courseId(): string | undefined {
    return this._courseId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== FACTORY: create() =====
  /**
   * Use when a tutor uploads a NEW material.
   * Generates a new MongoDB ObjectId automatically.
   *
   * EXAMPLE:
   *   const material = Material.create({
   *     title: 'Algebraic Word Problems',
   *     type: MaterialType.PDF,
   *     subject: 'Algebra',
   *     topic: 'Word Problems',
   *     uploadedBy: req.user.userId,
   *     assignedTo: ['studentId1', 'studentId2'],
   *     ...fileData,
   *   });
   */
  static create(props: CreateMaterialProps): Material {
    return new Material({
      id: new Types.ObjectId(),
      title: props.title,
      description: props.description,
      type: props.type,
      subject: props.subject,
      topic: props.topic,
      fileUrl: props.fileUrl,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      originalName: props.originalName,
      uploadedBy: new Types.ObjectId(props.uploadedBy),
      assignedTo: (props.assignedTo ?? []).map((id) => new Types.ObjectId(id)),
      courseId: props.courseId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ===== FACTORY: fromPersistence() =====
  /**
   * Use when loading a material FROM the database.
   * The ID already exists — don't generate a new one.
   *
   * SAME PATTERN AS: User.fromPersistence() in `src/modules/users/domain/entities/user-entity.ts
   */
  static fromPersistence(props: MaterialPersistenceProps): Material {
    return new Material(props);
  }

  // ===== BUSINESS METHODS =====
  /**
   * Assign this material to additional students.
   *
   * WHY A METHOD INSTEAD OF DIRECT ARRAY PUSH?
   *   - Prevents duplicate assignments
   *   - Entity controls its own state
   *   - Easy to add validation later (e.g., max students)
   */
  assignTo(studentIds: string[]): void {
    const existingIds = new Set(this._assignedTo.map((id) => id.toHexString()));

    for (const studentId of studentIds) {
      if (!existingIds.has(studentId)) {
        this._assignedTo.push(new Types.ObjectId(studentId));
      }
    }
  }

  /**
   * Check if a specific student is assigned to this material.
   * Used by the query handler to verify access.
   */
  isAssignedTo(studentId: string): boolean {
    return this._assignedTo.some((id) => id.toHexString() === studentId);
  }

  // ===== toResponse() =====
  /**
   * Convert to API response format.
   * REPLACES returning the raw entity from controllers.
   *
   * SAME PATTERN AS: user.toResponse() in user-entity.ts
   *
   * WHY: Controllers should never return domain entities.
   * Entities are internal. Responses are external contracts.
   */
  toResponse() {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      type: this._type,
      subject: this._subject,
      topic: this._topic,
      fileUrl: this._fileUrl,
      fileSize: this._fileSize,
      mimeType: this._mimeType,
      originalName: this._originalName,
      uploadedBy: this.uploadedBy,
      assignedTo: this.assignedTo,
      assignedCount: this.assignedCount,
      courseId: this._courseId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== toPersistence() =====
  /**
   * Convert to database format.
   * Used by the repository when saving to MongoDB.
   *
   * NOTICE: Returns _id (MongoDB format), not id (domain format).
   * This is the REVERSE of fromPersistence().
   */
  toPersistence() {
    return {
      _id: this._id,
      title: this._title,
      description: this._description,
      type: this._type,
      subject: this._subject,
      topic: this._topic,
      fileUrl: this._fileUrl,
      fileSize: this._fileSize,
      mimeType: this._mimeType,
      originalName: this._originalName,
      uploadedBy: this._uploadedBy,
      assignedTo: this._assignedTo,
      courseId: this._courseId,
    };
  }
}
