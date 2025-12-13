import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const versions = [
  { name: "General", updated: "Nov 30", highlights: "Covers foundational experience" },
  { name: "AI/ML", updated: "Nov 28", highlights: "Emphasizes data platforms & models" },
  { name: "Product", updated: "Nov 25", highlights: "Focuses on strategy & outcomes" },
]

export default function UserResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Resume vault</p>
        <h1 className="text-2xl font-semibold text-white">Tailored versions</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {versions.map((version) => (
          <Card key={version.name} className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>{version.name}</CardTitle>
              <CardDescription className="text-white/70">Updated {version.updated}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/80">
              <p>{version.highlights}</p>
              <Button variant="secondary" className="w-full">
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
