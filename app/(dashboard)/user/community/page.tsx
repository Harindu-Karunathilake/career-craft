import { PublishedInterviewsList } from "@/components/dashboard/published-interviews";
import { PublishedCoursesList } from "@/components/dashboard/published-courses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobsList } from "@/components/dashboard/jobs-list";

export default function UserCommunityPage() {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div>
                 <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Community</p>
                <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
                <p className="text-muted-foreground mt-1">Discover interviews, courses, and jobs.</p>
            </div>

            <Tabs defaultValue="courses" className="space-y-6">
                <TabsList className="bg-transparent p-0 border-b border-white/10 w-full justify-start h-auto rounded-none">
                    <TabsTrigger 
                        value="interviews" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent px-0 pb-3 pt-2 mr-6 font-medium text-muted-foreground data-[state=active]:text-indigo-400 hover:text-white transition-colors"
                    >
                        Interviews
                    </TabsTrigger>
                    <TabsTrigger 
                        value="courses" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-0 pb-3 pt-2 mr-6 font-medium text-muted-foreground data-[state=active]:text-emerald-400 hover:text-white transition-colors"
                    >
                        Courses
                    </TabsTrigger>
                    <TabsTrigger 
                        value="jobs" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:text-blue-400 hover:text-white transition-colors"
                    >
                        Jobs
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="interviews" className="animate-in slide-in-from-left-4 duration-300">
                    <PublishedInterviewsList />
                </TabsContent>
                
                <TabsContent value="courses" className="animate-in slide-in-from-right-4 duration-300">
                    <PublishedCoursesList />
                </TabsContent>

                <TabsContent value="jobs" className="animate-in slide-in-from-right-4 duration-300">
                    <JobsList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
