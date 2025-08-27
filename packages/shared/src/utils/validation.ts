import { z } from 'zod';

export class ValidationUtils {
  /**
   * Validate data against a Zod schema and return result with typed errors
   */
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    );
    
    return { success: false, errors };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidSchema = z.string().uuid();
    return uuidSchema.safeParse(uuid).success;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain numbers');
    }

    if (/[^a-zA-Z\d]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain special characters');
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }
}