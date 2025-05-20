/**
 * Generates a cache key for user listing queries
 *
 * @param itemName - Name item
 * @param userActionId - The ID of the user performing the action (used for authorization context)
 * @param page - The page number for pagination (starts from 1)
 * @param limit - The maximum number of items per page
 * @param q - Optional search query string to filter users by name or email
 * @returns A formatted cache key string in the format: "users:all:user-{userActionId}:page-{page}:limit-{limit}:q-{encodedQuery}"
 *
 * @example
 * ```typescript
 * // Basic usage without search query
 * generateCacheKey('user123', 1, 10);
 * // Returns: "users:all:user-user123:page-1:limit-10:q-"
 *
 * // With search query
 * generateCacheKey('user123', 2, 20, 'john doe');
 * // Returns: "users:all:user-user123:page-2:limit-20:q-john%20doe"
 * ```
 */
export function generateCacheKeyAll(
  itemName: string,
  userActiveId: string,
  page: number,
  limit: number,
  q?: string,
): string {
  const safeQ = q ? encodeURIComponent(q) : '';
  return `${itemName}:all:user-${userActiveId}:page-${page}:limit-${limit}:q-${safeQ}`;
}
