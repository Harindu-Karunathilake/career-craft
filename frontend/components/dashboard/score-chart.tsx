"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface ScoreChartProps {
  data: { date: string; score: number; role?: string; timestamp?: number }[]
}

export function ScoreChart({ data }: ScoreChartProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle>Interview Performance</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                labelFormatter={(value) => new Date(value * 1000).toLocaleString()}
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                formatter={(value: any, name: any, props: any) => {
                    return [`${value}%`, props.payload.role || "Score"];
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981" // emerald-500
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6, fill: "#34d399" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
