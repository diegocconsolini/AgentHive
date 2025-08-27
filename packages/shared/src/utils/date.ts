export class DateUtils {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date | string): string {
    return new Date(date).toISOString();
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  }

  /**
   * Format date and time for display
   */
  static formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  static getRelativeTime(date: Date | string): string {
    const now = new Date();
    const dateObj = new Date(date);
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return this.formatDate(dateObj);
    }
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date | string): boolean {
    const today = new Date();
    const dateObj = new Date(date);
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Add days to date
   */
  static addDays(date: Date | string, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get start and end of day
   */
  static getDayBounds(date: Date | string): { start: Date; end: Date } {
    const dateObj = new Date(date);
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
}