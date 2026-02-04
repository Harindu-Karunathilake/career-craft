export interface Lesson {
    id: string;
    title: string;
    description?: string; // Short description
    content?: string; // Text content / Markdown
    videoUrl?: string; // URL for video
    duration?: number; // Minutes
    isFree?: boolean; // Preview allowed
}

export interface Chapter {
    id: string;
    title: string;
    lessons: Lesson[];
}

export interface Interview {
    id: string;
    role: string;
    experience: string;
    topic: string;
    status: "pending" | "completed";
    createdAt: any;
    feedback?: any;
    questions?: string[];
    // Publishing fields
    isPublished?: boolean;
    publishedAt?: any;
    coverImage?: string;
    authorName?: string;
    authorImage?: string;
    authorId?: string;
}

export interface PublishedInterview extends Interview {
    isPublished: true;
    publishedAt: any;
    authorName: string;
    authorImage: string;
}
