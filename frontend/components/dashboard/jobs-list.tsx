"use client";

import { useEffect, useState, useRef } from "react";
import { Search, MapPin, Briefcase, Building2, Calendar, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 5;

interface Job {
  id: number;
  role: string;
  company_name: string;
  company_num_employees: string | null;
  employment_type: string | null;
  location: string;
  remote: boolean;
  logo: string | null;
  url: string;
  text: string;
  date_posted: string;
  keywords: string[];
  source: string;
}

interface JobsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Job[];
}

export function JobsList() {
    // API State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [apiPage, setApiPage] = useState(1);
    const [apiHasNext, setApiHasNext] = useState(false);
    
    // View State
    const [viewOffset, setViewOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [isRemote, setIsRemote] = useState(false);

    // Navigation Direction (to handle viewOffset on API page change)
    const navDirection = useRef<'forward' | 'backward' | 'reset'>('reset');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [debouncedLocation, setDebouncedLocation] = useState("");

    // Reset everything when filters change
    useEffect(() => {
        setApiPage(1);
        setViewOffset(0);
        navDirection.current = 'reset';
    }, [debouncedSearch, debouncedLocation, isRemote]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setDebouncedLocation(location);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, location]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams();
                if (debouncedSearch) queryParams.set("search", debouncedSearch);
                if (debouncedLocation) queryParams.set("location", debouncedLocation);
                if (isRemote) queryParams.set("remote", "true");
                queryParams.set("page", apiPage.toString());
                queryParams.set("sort_by", "relevance");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?${queryParams.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch jobs");
                
                const data: JobsResponse = await res.json();
                const newJobs = data.results || [];
                setJobs(newJobs);
                setApiHasNext(!!data.next);

                // Handle View Offset based on navigation direction
                if (navDirection.current === 'backward') {
                    // If we came backwards to this page, show the last chunk
                    const lastChunkOffset = Math.max(0, Math.floor((newJobs.length - 1) / ITEMS_PER_PAGE) * ITEMS_PER_PAGE);
                    setViewOffset(lastChunkOffset);
                } else {
                    // Forward, Reset, or Initial load -> start at 0
                    setViewOffset(0);
                }
                
                // Reset direction for subsequent interactions within this page
                navDirection.current = 'reset';

            } catch (error) {
                console.error("Error fetching jobs:", error);
                toast.error("Failed to load jobs. Please try again later.");
                setJobs([]);
            } finally {
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        fetchJobs();
    }, [debouncedSearch, debouncedLocation, isRemote, apiPage]);

    // Derived State for Display
    const displayedJobs = jobs.slice(viewOffset, viewOffset + ITEMS_PER_PAGE);
    
    // Pagination Logic
    const hasNextLocal = viewOffset + ITEMS_PER_PAGE < jobs.length;
    const hasPrevLocal = viewOffset > 0;
    
    // Combined Pagination State
    const canGoNext = hasNextLocal || apiHasNext;
    const canGoPrev = hasPrevLocal || apiPage > 1;

    const handleNextPage = () => {
        if (hasNextLocal) {
            setViewOffset(prev => prev + ITEMS_PER_PAGE);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (apiHasNext) {
            navDirection.current = 'forward';
            setApiPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrevLocal) {
            setViewOffset(prev => Math.max(0, prev - ITEMS_PER_PAGE));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (apiPage > 1) {
            navDirection.current = 'backward';
            setApiPage(p => p - 1);
        }
    };

    // Calculate generic page number for display (approximation across API pages)
    // Page 1: Items 1-5 (API 1, Offset 0)
    // Page 2: Items 6-10 (API 1, Offset 5) ...
    // This is tricky to display globally without total count and consistent page size.
    // Simpler: Just show "Next" / "Previous" without generic "Page X of Y" unless we calc it.
    // Local Page: (viewOffset / 5) + 1. 
    // Absolute Page Estimate? ((apiPage - 1) * (Assumed API Page Size / 5)) + Local Page?
    // Let's just show "Page" based on simple incrementing counter? 
    // No, state reset on filter change makes "Page 1" correct.
    // Complex absolute page number is risky if API page size varies.
    // Let's stick to simple "Previous" / "Next" buttons, maybe minimal page indicator if needed.

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs (e.g. React, Python)..."
                            className="pl-9 bg-card/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-1">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Location (e.g. London)..."
                            className="pl-9 bg-card/50"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Switch id="remote-mode" checked={isRemote} onCheckedChange={setIsRemote} />
                    <Label htmlFor="remote-mode" className="text-sm font-medium leading-none text-muted-foreground">
                        Remote Only
                    </Label>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="bg-card/50 border-white/5">
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-16 w-full" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : displayedJobs.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid gap-4">
                        {displayedJobs.map((job) => (
                            <Card key={job.id} className="group hover:border-indigo-500/50 transition-all duration-300 bg-card/50 border-white/5 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-indigo-400 transition-colors">
                                                        {job.role}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        <span>{job.company_name}</span>
                                                        <span className="text-white/20">•</span>
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span>{job.location}</span>
                                                        {job.remote && (
                                                            <>
                                                                <span className="text-white/20">•</span>
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-emerald-500/10 text-emerald-500 border-0">Remote</Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="shrink-0 gap-2 hidden md:flex" asChild>
                                                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                        Apply Now <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {job.keywords?.slice(0, 5).map((keyword, i) => (
                                                    <Badge key={i} variant="outline" className="bg-white/5 text-xs font-normal text-muted-foreground border-white/10 hover:bg-white/10 transition-colors">
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground/60">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    <span>{job.employment_type || "Full-time"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>Posted {formatDistanceToNow(new Date(job.date_posted), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button size="sm" className="w-full md:hidden mt-4 gap-2" asChild>
                                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                                Apply Now <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handlePrevPage} 
                            disabled={!canGoPrev}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                           Showing {viewOffset + 1}-{Math.min(viewOffset + ITEMS_PER_PAGE, jobs.length)} of {jobs.length > 0 ? 'many' : '0'} 
                        </span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleNextPage} 
                            disabled={!canGoNext}
                            className="gap-2"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No jobs found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
