import { PublishedInterviewsList } from "@/components/dashboard/published-interviews";

export default function PublishedInterviewsPage() {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div>
                 <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Community</p>
                <h1 className="text-3xl font-bold tracking-tight">Published Interviews</h1>
                <p className="text-muted-foreground mt-1">Explore interview experiences shared by the community.</p>
            </div>

            <PublishedInterviewsList />
        </div>
    );
}
