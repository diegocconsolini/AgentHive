import { JWTPayload, JWTPayloadSchema } from '../types/auth.js';

export class AuthUtils {
  /**
   * Base64URL decode function for JWT
   */
  private static base64UrlDecode(str: string): string {
    // Add padding if needed
    str += new Array(5 - (str.length % 4)).join('=');
    // Replace URL-safe characters
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  /**
   * Decode and validate JWT token
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      // JWT has 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      // Decode the payload (second part)
      const payload = this.base64UrlDecode(parts[1]);
      const decoded = JSON.parse(payload);
      
      // Validate the payload structure
      const validation = JWTPayloadSchema.safeParse(decoded);
      return validation.success ? validation.data : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
  }

  /**
   * Create Authorization header
   */
  static createAuthHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    return match ? match[1] : null;
  }
}