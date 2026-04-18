"use client"

import { usePathname } from "next/navigation"

/**
 * Returns the base path for the current dashboard context.
 * - Tutor dashboard (/tutor/...) → "/tutor"
 * - User dashboard (/user/...) or anything else → "/user"
 *
 * Use this anywhere a page is shared between both dashboards
 * to build role-aware internal links.
 *
 * @example
 * const dashBase = useDashBase()
 * <Link href={`${dashBase}/friends`}>Friends</Link>
 */
export function useDashBase(): string {
  const pathname = usePathname()
  return pathname.startsWith("/tutor") ? "/tutor" : "/user"
}
