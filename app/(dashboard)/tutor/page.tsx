"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Eye, BookOpen, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseAnalyticsChart } from "@/components/dashboard/course-analytics-chart";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

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
    totalStudents: number;
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

                // Run course fetch + enrollment fetch in parallel.
                // Enrollments can have status: "paid" | "free" | "completed"
                // Revenue only counts "paid" (not free), but student count counts all active statuses.
                const [courseSnap, paidEnrollSnap, freeEnrollSnap] = await Promise.all([
                    getDocs(q),
                    getDocs(
                        query(
                            collection(firebaseDb, "enrollments"),
                            where("tutorId", "==", user.uid),
                            where("status", "==", "paid")
                        )
                    ),
                    getDocs(
                        query(
                            collection(firebaseDb, "enrollments"),
                            where("tutorId", "==", user.uid),
                            where("status", "in", ["free", "completed"])
                        )
                    ),
                ]);

                const data: Course[] = courseSnap.docs.map((d) => ({
                    id: d.id,
                    title: d.data().title ?? "Untitled",
                    views: d.data().views ?? 0,
                    published: d.data().published ?? false,
                    price: d.data().price ?? 0,
                    enrollments: d.data().enrollments ?? 0,
                    createdAt: d.data().createdAt,
                }));

                data.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
                setCourses(data);

                // Revenue = sum of tutorShare from PAID enrollments only
                const totalRevenue = paidEnrollSnap.docs.reduce(
                    (s, d) => s + (d.data().tutorShare ?? 0),
                    0
                );
                // Students = everyone enrolled (paid + free + completed)
                const totalStudents = paidEnrollSnap.docs.length + freeEnrollSnap.docs.length;

                const totalViews = data.reduce((s, c) => s + (c.views ?? 0), 0);
                const publishedCourses = data.filter((c) => c.published).length;

                setStats({ totalViews, totalCourses: data.length, publishedCourses, totalRevenue, totalStudents });
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
            value: loading ? "—" : (stats?.totalStudents ?? 0).toLocaleString(),
            icon: Users,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
            sub: "enrolled across courses",
        },
        {
            label: "Est. Revenue",
            value: loading
                ? "—"
                : `LKR ${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            sub: "from paid enrollments",
        },
    ];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 relative z-10">
            {/* Header */}
            <motion.div variants={itemVariants}>
                <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-1">
                    Overview
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-white">Tutor Dashboard</h1>
                <p className="text-white/60 mt-1">
                    Here&apos;s how your courses are performing.
                </p>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                    <motion.div key={s.label} variants={itemVariants} className="h-full">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 pt-4 px-5">
                                <CardTitle className="text-xs font-semibold tracking-widest uppercase text-white/50">
                                    {s.label}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${s.bg}`}>
                                    <s.icon className={`h-4 w-4 ${s.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10 px-5 pb-4">
                                <div className="text-3xl font-bold tracking-tight text-white">{s.value}</div>
                                <p className="text-xs text-white/40 mt-1">{s.sub}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Top Courses Table */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Bar Chart */}
                <motion.div variants={itemVariants} className="h-full lg:col-span-4">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl h-full relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%)]" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-xl font-semibold tracking-tight text-white">Top Courses by Views</CardTitle>
                            <CardDescription className="text-white/60">Your 5 most-viewed courses</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <CourseAnalyticsChart courses={courses} />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Courses List */}
                <motion.div variants={itemVariants} className="h-full lg:col-span-3">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl h-full relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.05),transparent_50%)]" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-xl font-semibold tracking-tight text-white">All Courses</CardTitle>
                            <CardDescription className="text-white/60">Sorted by total views</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 px-5 pb-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-[180px] text-white/50 text-sm">
                                    Loading…
                                </div>
                            ) : courses.length === 0 ? (
                                <div className="flex items-center justify-center h-[180px] text-white/50 text-sm">
                                    No courses yet.
                                </div>
                            ) : (
                                <div className="space-y-3 relative z-10">
                                    {courses.map((course, i) => (
                                        <div
                                            key={course.id}
                                            className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0"
                                        >
                                            <span className="text-xs font-bold text-white/40 w-5 shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{course.title}</p>
                                                <Badge
                                                    variant={course.published ? "default" : "secondary"}
                                                    className={`mt-0.5 text-[10px] h-4 px-1 border-0 ${course.published ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
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
                </motion.div>
            </div>
        </motion.div>
    );
}
