"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface CourseData {
    id: string;
    title: string;
    views: number;
    published: boolean;
}

interface Props {
    courses: CourseData[];
}

const COLORS = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a78bfa", // purple
    "#c4b5fd", // light purple
    "#ddd6fe", // lighter purple
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm">
                <p className="font-medium text-white">{payload[0].payload.fullTitle}</p>
                <p className="text-indigo-400 font-bold">{payload[0].value.toLocaleString()} views</p>
            </div>
        );
    }
    return null;
};

export function CourseAnalyticsChart({ courses }: Props) {
    // Take top 5 by views, descending
    const top5 = [...courses]
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 5)
        .map((c) => ({
            name: c.title.length > 18 ? c.title.slice(0, 17) + "…" : c.title,
            fullTitle: c.title,
            views: c.views ?? 0,
        }));

    if (top5.length === 0 || top5.every((c) => c.views === 0)) {
        return (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                No view data yet — views accumulate as students visit your courses.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="views" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {top5.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
