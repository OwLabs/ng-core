import { Types } from 'mongoose';
import { Material } from 'src/modules/materials/domain/entities';
import { MaterialType } from 'src/modules/materials/domain/enums';

let material: Material;

const createMaterial = (overrides = {}) =>
  Material.create({
    title: 'Algebra Basics',
    description: 'Introduction to algebra',
    type: MaterialType.PDF,
    subject: 'Mathematics',
    topic: 'Algebra',
    uploadedBy: '507f1f77bcf86cd799439011',
    fileUrl: '/uploads/algebra.pdf',
    fileSize: 2048,
    mimeType: 'application/pdf',
    originalName: 'algebra.pdf',
    ...overrides,
  });

const generateStudentIds = (count: number): Types.ObjectId[] =>
  Array.from({ length: count }, () => new Types.ObjectId());

beforeEach(() => {
  material = createMaterial();
});

describe('Material Entity', () => {
  describe('create()', () => {
    it('should generate a unique ID', () => {
      const another = createMaterial();
      expect(material.id).toBeDefined();
      expect(material.id).not.toBe(another.id);
    });

    it('should store all fields correctly', () => {
      expect(material.title).toBe('Algebra Basics');
      expect(material.description).toBe('Introduction to algebra');
      expect(material.type).toBe(MaterialType.PDF);
      expect(material.subject).toBe('Mathematics');
      expect(material.topic).toBe('Algebra');
      expect(material.uploadedBy).toBe('507f1f77bcf86cd799439011');
      expect(material.fileUrl).toBe('/uploads/algebra.pdf');
      expect(material.fileSize).toBe(2048);
      expect(material.mimeType).toBe('application/pdf');
      expect(material.originalName).toBe('algebra.pdf');
    });

    it('should default assignedTo as empty array', () => {
      expect(material.assignedTo).toEqual([]);
      expect(material.assignedCount).toBe(0);
    });

    it('should accept initial assignedTo list', () => {
      const students = generateStudentIds(2);

      const withStudents = createMaterial({
        assignedTo: students,
      });

      expect(withStudents.assignedTo).toHaveLength(2);
      expect(withStudents.assignedCount).toBe(2);
    });
  });

  describe('toResponse()', () => {
    it('should return correct shape with string IDs', () => {
      const response = material.toResponse();

      expect(response).toMatchObject({
        id: expect.any(String),
        title: 'Algebra Basics',
        description: 'Introduction to algebra',
        type: 'pdf',
        subject: 'Mathematics',
        topic: 'Algebra',
        fileUrl: '/uploads/algebra.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        originalName: 'algebra.pdf',
        uploadedBy: expect.any(String),
        assignedTo: [],
        assignedCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should NOT contain _id (MongoDB format)', () => {
      const response = material.toResponse();

      expect((response as any)._id).toBeUndefined();
    });
  });

  describe('toPersistence()', () => {
    it('should return _id for MongoDB', () => {
      const persisted = material.toPersistence();

      expect(persisted._id).toBeDefined();
      expect((persisted as any).id).toBeUndefined();
    });
  });

  describe('assignTo()', () => {
    it('should add students', () => {
      const students = generateStudentIds(2).map((id) => id.toString());
      material.assignTo(students);

      expect(material.assignedTo).toHaveLength(2);
      expect(material.assignedCount).toBe(2);
    });

    it('should NOT add duplicate students', () => {
      const students = generateStudentIds(3).map((id) => id.toString());
      material.assignTo(students);
      material.assignTo(students); // re-do again to test duplication

      expect(material.assignedTo).toHaveLength(3);
    });

    it('should handle assigning to empty array', () => {
      material.assignTo([]);
      expect(material.assignedTo).toHaveLength(0);
    });
  });

  describe('isAssignedTo()', () => {
    it('should return true for assigned student', () => {
      const student = generateStudentIds(1).map((id) => id.toString());
      material.assignTo(student);

      expect(material.isAssignedTo(student.toString())).toBe(true);
    });

    it('should return false for unassigned student', () => {
      const studentA = generateStudentIds(1).map((id) => id.toString());
      const studentB = generateStudentIds(1).map((id) => id.toString());
      material.assignTo(studentA);

      expect(material.isAssignedTo(studentB.toString())).toBe(false);
    });

    it('should return false when no students assigned', () => {
      expect(material.isAssignedTo('anyone')).toBe(false);
    });
  });
});
