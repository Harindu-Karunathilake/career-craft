"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserPlus, UserCheck, Clock, Users } from "lucide-react";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAllUsers, getRelationshipStatus, sendFriendRequest } from "@/lib/actions/social";
import type { PublicUserProfile } from "@/types";

type RelStatus = "none" | "friends" | "request_sent" | "request_received" | "loading";

function PeopleCard({
  user,
  currentUser,
}: {
  user: PublicUserProfile;
  currentUser: { uid: string; displayName: string; photoURL: string };
}) {
  const [status, setStatus] = useState<RelStatus>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRelationshipStatus(currentUser.uid, user.uid)
      .then((s) => { if (!cancelled) setStatus(s); })
      .catch(() => { if (!cancelled) setStatus("none"); });
    return () => { cancelled = true; };
  }, [currentUser.uid, user.uid]);

  const handleAdd = async () => {
    setBusy(true);
    setStatus("request_sent");
    try {
      await sendFriendRequest(
        { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
        { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
      );
    } catch {
      setStatus("none");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 hover:bg-white/[0.08] hover:border-primary/20 transition-all">
      <div className="relative h-11 w-11 flex-shrink-0 rounded-full overflow-hidden bg-white/10 ring-2 ring-primary/20 flex items-center justify-center">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={user.displayName} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-primary font-bold">{user.displayName?.[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{user.displayName}</p>
        <p className="text-xs text-white/40">{user.tier || "Novice"} · {user.careerXp || 0} XP</p>
      </div>
      <div className="flex-shrink-0">
        {status === "loading" && <div className="h-7 w-20 rounded-lg bg-white/10 animate-pulse" />}
        {status === "friends" && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <UserCheck className="h-3.5 w-3.5" /> Friends
          </span>
        )}
        {status === "request_sent" && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" /> Sent
          </span>
        )}
        {status === "request_received" && (
          <span className="text-xs text-primary">Respond ↗</span>
        )}
        {status === "none" && (
          <button
            onClick={handleAdd}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Friend
          </button>
        )}
      </div>
    </div>
  );
}

/** Shared People tab — used by both user and tutor community pages */
export function PeopleTab() {
  const [currentUser, setCurrentUser] = useState<{
    uid: string; displayName: string; photoURL: string;
  } | null>(null);
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUnsub = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(firebaseDb, "users", user.uid));
        const data = snap.exists() ? snap.data() : null;
        setCurrentUser({
          uid: user.uid,
          displayName: data?.name || data?.displayName || user.displayName || "Unknown",
          photoURL: user.photoURL || "",
        });
        const all = await getAllUsers(user.uid);
        setUsers(all);
      } catch (err) {
        console.error("[PeopleTab] error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => authUnsub();
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Users className="h-10 w-10 text-white/20" />
        <p className="text-white/40 text-sm">No other users yet.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {currentUser && users.map((u) => (
        <PeopleCard key={u.uid} user={u} currentUser={currentUser} />
      ))}
    </div>
  );
}
