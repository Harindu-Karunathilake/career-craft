"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface DemandingJobsChartProps {
  data: { role: string; count: number }[]
}

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"]

export function DemandingJobsChart({ data }: DemandingJobsChartProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-white col-span-2">
      <CardHeader>
        <CardTitle>Most Demanding Jobs</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
                nameKey="role"
                label={({cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const angle = midAngle ?? 0;
                    const p = percent ?? 0;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-angle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-angle * Math.PI / 180);
                  
                    return p > 0.05 ? (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(p * 100).toFixed(0)}%`}
                      </text>
                    ) : null;
                  }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
