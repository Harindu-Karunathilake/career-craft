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

export interface FriendRequest {
  id: string
  fromUid: string
  toUid: string
  fromName: string
  fromPhoto: string
  toName: string
  toPhoto: string
  status: "pending" | "accepted" | "declined"
  createdAt: any
}

export interface Friend {
  uid: string
  name: string
  photo: string
  since: any
  tier?: string
  careerXp?: number
}

export interface ChatMessage {
  id: string
  senderId: string
  text: string
  createdAt: any
}

export interface PublicUserProfile {
  uid: string
  displayName: string
  photoURL: string
  tier?: string
  careerXp?: number
  email?: string
}

export interface AppNotification {
  id: string
  type: "message" | "friend_request"
  // message-specific
  chatId?: string
  senderUid?: string
  senderName?: string
  senderPhoto?: string
  text?: string           // message preview
  // friend_request-specific (mirrors FriendRequest fields for convenience)
  fromUid?: string
  fromName?: string
  fromPhoto?: string
  toUid?: string
  toName?: string
  toPhoto?: string
  // shared
  read: boolean
  createdAt: any
}
