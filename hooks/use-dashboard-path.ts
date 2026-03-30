"use client";

import { useAuth } from "./use-auth";

/**
 * Returns the correct dashboard base path based on the logged-in user's role.
 * - tutor → /tutor
 * - user (default) → /user
 */
export function useDashboardPath() {
    const { profile } = useAuth();
    const isTutor = profile?.role === "tutor";
    return {
        base: isTutor ? "/tutor" : "/user",
        interviews: isTutor ? "/tutor/interviews" : "/user/interviews",
        resume: isTutor ? "/tutor/resume" : "/user/resume",
        isTutor,
    };
}
