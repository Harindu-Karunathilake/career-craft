"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
    startTime?: number; // timestamp
}

export default function Timer({ startTime }: TimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000); // seconds
            setElapsed(diff > 0 ? diff : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-white/80 font-mono text-sm">
            <Clock className="h-4 w-4 text-emerald-500" />
            {formatTime(elapsed)}
        </div>
    );
}
