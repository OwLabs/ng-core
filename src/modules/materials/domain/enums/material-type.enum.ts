/**
 * MaterialType Enum
 *
 * WHY AN ENUM INSTEAD OF STRING UNION ('document' | 'video')?
 *   1. Enums are extendable - add IMAGE, NOTES without hunting for string literals
 *   2. Enums are self-documenting - MaterialType.PDF vs 'pdf'
 *   3. Enums work with class-validator's @IsEnum() decorator
 *   4. Enums can be iterated (Object.values(MaterialType))
 *
 * COMPARE:
 *   Old: type: 'document' | 'video'       ← scattered, easy to mistype
 *   New: type: MaterialType                ← single source of truth
 *
 * SAME PATTERN AS: UserRole enum in users/domain/enums/
 */
export enum MaterialType {
  PDF = 'pdf',
  VIDEO = 'video',
  IMAGE = 'image',
  NOTES = 'notes',
}
