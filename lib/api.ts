/**
 * API base URL configuration for native (Capacitor) builds.
 *
 * When the app runs inside Capacitor on iOS, it is served from a static export
 * and Next.js API routes are not available locally. All API calls must be
 * routed to the deployed backend at goutcare.app.
 *
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local before building for iOS:
 *   NEXT_PUBLIC_API_BASE_URL=https://goutcare.app
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function isNative(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  );
}

/**
 * Returns the full URL for an API route. On web, returns the relative path
 * as-is. On native (Capacitor), prepends the backend URL (goutcare.app).
 */
export function getApiUrl(path: string): string {
  if (isNative() && API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}
