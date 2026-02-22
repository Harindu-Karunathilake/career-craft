"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Eye, BookOpen, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseAnalyticsChart } from "@/components/dashboard/course-analytics-chart";

interface Course {
    id: string;
    title: string;
    views: number;
    published: boolean;
    price: number;
    enrollments?: number;
    createdAt: any;
}

interface Stats {
    totalViews: number;
    totalCourses: number;
    publishedCourses: number;
    totalRevenue: number;
}

export default function TutorDashboardPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
            if (!user) { setLoading(false); return; }

            try {
                const q = query(
                    collection(firebaseDb, "courses"),
                    where("tutorId", "==", user.uid)
                );
                const snap = await getDocs(q);
                const data: Course[] = snap.docs.map((d) => ({
                    id: d.id,
                    title: d.data().title ?? "Untitled",
                    views: d.data().views ?? 0,
                    published: d.data().published ?? false,
                    price: d.data().price ?? 0,
                    enrollments: d.data().enrollments ?? 0,
                    createdAt: d.data().createdAt,
                }));

                // Sort by views desc for the table
                data.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
                setCourses(data);

                const totalViews = data.reduce((s, c) => s + (c.views ?? 0), 0);
                const publishedCourses = data.filter((c) => c.published).length;
                const totalRevenue = data.reduce(
                    (s, c) => s + c.price * (c.enrollments ?? 0),
                    0
                );

                setStats({
                    totalViews,
                    totalCourses: data.length,
                    publishedCourses,
                    totalRevenue,
                });
            } catch (e) {
                console.error("Tutor dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const statCards = [
        {
            label: "Total Views",
            value: loading ? "—" : (stats?.totalViews ?? 0).toLocaleString(),
            icon: Eye,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            sub: "across all your courses",
        },
        {
            label: "Published Courses",
            value: loading ? "—" : stats?.publishedCourses ?? 0,
            icon: BookOpen,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            sub: `${stats?.totalCourses ?? 0} total (incl. drafts)`,
        },
        {
            label: "Total Students",
            value: loading
                ? "—"
                : courses.reduce((s, c) => s + (c.enrollments ?? 0), 0).toLocaleString(),
            icon: Users,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
            sub: "enrolled across courses",
        },
        {
            label: "Est. Revenue",
            value: loading
                ? "—"
                : `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            sub: "from paid enrollments",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header */}
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-1">
                    Overview
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Tutor Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s how your courses are performing.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                    <Card key={s.label} className="bg-card border-border/60 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {s.label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${s.bg}`}>
                                <s.icon className={`h-4 w-4 ${s.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-4">
                            <div className="text-2xl font-bold">{s.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart + Top Courses Table */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Bar Chart */}
                <Card className="lg:col-span-4 bg-card border-border/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top Courses by Views</CardTitle>
                        <CardDescription>Your 5 most-viewed courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CourseAnalyticsChart courses={courses} />
                    </CardContent>
                </Card>

                {/* Top Courses List */}
                <Card className="lg:col-span-3 bg-card border-border/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">All Courses</CardTitle>
                        <CardDescription>Sorted by total views</CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                                Loading…
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                                No courses yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {courses.map((course, i) => (
                                    <div
                                        key={course.id}
                                        className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                                    >
                                        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{course.title}</p>
                                            <Badge
                                                variant={course.published ? "default" : "secondary"}
                                                className="mt-0.5 text-[10px] h-4 px-1"
                                            >
                                                {course.published ? "Published" : "Draft"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold shrink-0">
                                            <Eye className="h-3 w-3" />
                                            {(course.views ?? 0).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
