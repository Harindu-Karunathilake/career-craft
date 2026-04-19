import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import type { Friend, FriendRequest, ChatMessage, PublicUserProfile, AppNotification } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic chat ID: always smaller UID first */
export function getChatId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_")
}

// ─── User Search ──────────────────────────────────────────────────────────────

export async function searchUsers(
  searchQuery: string,
  currentUid: string
): Promise<PublicUserProfile[]> {
  if (!searchQuery.trim()) return []

  // Fetch all users (up to 100) and filter client-side.
  // Avoids Firestore composite index requirements for range queries.
  const snap = await getDocs(query(collection(firebaseDb, "users"), limit(100)))
  const search = searchQuery.toLowerCase().trim()
  const results: PublicUserProfile[] = []

  snap.forEach((d) => {
    if (d.id === currentUid) return
    const data = d.data()
    const name = (data.name || data.displayName || "").toLowerCase()
    if (!name.includes(search)) return
    results.push({
      uid: d.id,
      displayName: data.name || data.displayName || "Unknown",
      photoURL: data.photoURL || "",
      tier: data.tier,
      careerXp: data.careerXp,
    })
  })
  return results
}

export async function getAllUsers(currentUid: string): Promise<PublicUserProfile[]> {
  const usersRef = collection(firebaseDb, "users")
  const q = query(usersRef, limit(50))
  const snap = await getDocs(q)
  const results: PublicUserProfile[] = []
  snap.forEach((d) => {
    if (d.id === currentUid) return
    const data = d.data()
    const name = data.name || data.displayName
    if (!name) return
    results.push({
      uid: d.id,
      displayName: name,
      photoURL: data.photoURL || "",
      tier: data.tier,
      careerXp: data.careerXp,
    })
  })
  return results
}

export async function getUserProfile(uid: string): Promise<PublicUserProfile | null> {
  const snap = await getDoc(doc(firebaseDb, "users", uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid: snap.id,
    displayName: data.name || data.displayName || "Unknown",
    photoURL: data.photoURL || "",
    tier: data.tier,
    careerXp: data.careerXp,
    email: data.email,
  }
}

// ─── Friend Requests ──────────────────────────────────────────────────────────

export async function sendFriendRequest(
  from: { uid: string; displayName: string; photoURL: string },
  to: { uid: string; displayName: string; photoURL: string }
): Promise<void> {
  // Guard: don't duplicate
  const existing = await getDocs(
    query(
      collection(firebaseDb, "friendRequests"),
      where("fromUid", "==", from.uid),
      where("toUid", "==", to.uid),
      where("status", "==", "pending")
    )
  )
  if (!existing.empty) return

  await addDoc(collection(firebaseDb, "friendRequests"), {
    fromUid: from.uid,
    toUid: to.uid,
    fromName: from.displayName || "Unknown",
    fromPhoto: from.photoURL || "",
    toName: to.displayName || "Unknown",
    toPhoto: to.photoURL || "",
    status: "pending",
    createdAt: serverTimestamp(),
  })
}

export async function acceptFriendRequest(req: FriendRequest): Promise<void> {
  // Mark request accepted
  await updateDoc(doc(firebaseDb, "friendRequests", req.id), { status: "accepted" })

  const now = serverTimestamp()

  // Add each user to the other's friends sub-collection
  await setDoc(doc(firebaseDb, "friends", req.toUid, "list", req.fromUid), {
    uid: req.fromUid,
    name: req.fromName,
    photo: req.fromPhoto,
    since: now,
  })
  await setDoc(doc(firebaseDb, "friends", req.fromUid, "list", req.toUid), {
    uid: req.toUid,
    name: req.toName,
    photo: req.toPhoto,
    since: now,
  })
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(firebaseDb, "friendRequests", requestId), { status: "declined" })
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(firebaseDb, "friendRequests", requestId))
}

export async function removeFriend(currentUid: string, friendUid: string): Promise<void> {
  await deleteDoc(doc(firebaseDb, "friends", currentUid, "list", friendUid))
  await deleteDoc(doc(firebaseDb, "friends", friendUid, "list", currentUid))
}

/** Get all pending incoming friend requests for a user */
export async function getIncomingRequests(uid: string): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(
      collection(firebaseDb, "friendRequests"),
      where("toUid", "==", uid),
      where("status", "==", "pending")
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest))
}

/** Real-time listener for pending incoming requests */
export function subscribeToIncomingRequests(
  uid: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "friendRequests"),
    where("toUid", "==", uid),
    where("status", "==", "pending")
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest)))
  })
}

/** Get all outgoing (sent) pending requests */
export async function getOutgoingRequests(uid: string): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(
      collection(firebaseDb, "friendRequests"),
      where("fromUid", "==", uid),
      where("status", "==", "pending")
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest))
}

/** Get relationship status between currentUser and a target user */
export async function getRelationshipStatus(
  currentUid: string,
  targetUid: string
): Promise<"none" | "friends" | "request_sent" | "request_received"> {
  // Check friends
  const friendDoc = await getDoc(doc(firebaseDb, "friends", currentUid, "list", targetUid))
  if (friendDoc.exists()) return "friends"

  // Check sent
  const sent = await getDocs(
    query(
      collection(firebaseDb, "friendRequests"),
      where("fromUid", "==", currentUid),
      where("toUid", "==", targetUid),
      where("status", "==", "pending")
    )
  )
  if (!sent.empty) return "request_sent"

  // Check received
  const received = await getDocs(
    query(
      collection(firebaseDb, "friendRequests"),
      where("fromUid", "==", targetUid),
      where("toUid", "==", currentUid),
      where("status", "==", "pending")
    )
  )
  if (!received.empty) return "request_received"

  return "none"
}

// ─── Friends List ─────────────────────────────────────────────────────────────

export async function getFriends(uid: string): Promise<Friend[]> {
  const snap = await getDocs(collection(firebaseDb, "friends", uid, "list"))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      // The doc ID is always the friend's UID (set explicitly in acceptFriendRequest).
      // Fall back to doc ID in case the uid field was somehow not written.
      uid: data.uid || d.id,
    } as Friend
  })
}

// ─── Chat / Messages ──────────────────────────────────────────────────────────

/**
 * Send a chat message AND write an unread notification to the recipient.
 * recipientUid is the other person in the chat.
 * senderInfo is used to populate the notification preview.
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
  recipientUid: string,
  senderInfo: { name: string; photo: string }
): Promise<void> {
  const trimmed = text.trim()

  // 1. Write the message
  await addDoc(collection(firebaseDb, "messages", chatId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  })

  // 2. Write an unread notification to the recipient
  await addDoc(collection(firebaseDb, "users", recipientUid, "notifications"), {
    type: "message",
    chatId,
    senderUid: senderId,
    senderName: senderInfo.name,
    senderPhoto: senderInfo.photo,
    text: trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "messages", chatId, "messages"),
    orderBy("createdAt", "asc")
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        senderId: d.data().senderId,
        text: d.data().text,
        createdAt: d.data().createdAt,
      }))
    )
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Real-time listener for unread message notifications for a user.
 * Returns only unread message-type notifications, ordered newest first.
 */
export function subscribeToMessageNotifications(
  uid: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(firebaseDb, "users", uid, "notifications"),
    where("type", "==", "message"),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    limit(20)
  )
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))
      )
    },
    (err) => {
      if (err.code !== "permission-denied") {
        console.error("[notifications] snapshot error:", err)
      }
    }
  )
}

/**
 * Mark all unread message notifications from a specific chat as read.
 * Called when the user opens that chat.
 */
export async function markChatNotificationsRead(
  uid: string,
  chatId: string
): Promise<void> {
  const q = query(
    collection(firebaseDb, "users", uid, "notifications"),
    where("type", "==", "message"),
    where("chatId", "==", chatId),
    where("read", "==", false)
  )
  const snap = await getDocs(q)
  if (snap.empty) return

  const batch = writeBatch(firebaseDb)
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }))
  await batch.commit()
}
