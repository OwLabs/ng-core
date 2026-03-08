import { NameExceededException, NameLessException } from '../exceptions';

export class UserName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  static create(name: string): UserName {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      throw new NameLessException('Name must be at least 2 characters', this);
    }

    if (trimmed.length > 100) {
      throw new NameExceededException(
        'Name must not exceed 100 characters',
        this,
      );
    }

    return new UserName(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
