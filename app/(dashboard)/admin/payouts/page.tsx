"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, ChevronDown, Banknote, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { toast } from "sonner";

interface TutorPayout {
    tutorId: string;
    tutorName: string;
    tutorEmail: string;
    bankDetails: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        branchName: string;
    } | null;
    pendingEarnings: number;
    pendingEnrollmentIds: string[];
    paidTotal: number;
}

interface PayoutRequest {
    id: string;
    tutorId: string;
    tutorName: string;
    tutorEmail: string;
    totalAmount: number;
    bankDetails: TutorPayout["bankDetails"];
    enrollmentIds: string[];
    requestedAt: string;
}

export default function AdminPayoutsPage() {
    const [tutors, setTutors] = useState<TutorPayout[]>([]);
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch ALL paid enrollments then filter client-side.
            // Firestore's `!= true` skips docs without a `disbursed` field (legacy enrollments).
            const allEnrollSnap = await getDocs(
                query(
                    collection(firebaseDb, "enrollments"),
                    where("status", "==", "paid")
                )
            );

            // Group by tutorId — only include undisbursed ones as pending
            const tutorMap: Record<string, { pendingEarnings: number; enrollmentIds: string[] }> = {};
            allEnrollSnap.docs
                .filter((d) => !d.data().disbursed)  // client-side: include docs with no disbursed field
                .forEach((d) => {
                    const data = d.data();
                    if (!tutorMap[data.tutorId]) {
                        tutorMap[data.tutorId] = { pendingEarnings: 0, enrollmentIds: [] };
                    }
                    tutorMap[data.tutorId].pendingEarnings += data.tutorShare ?? 0;
                    tutorMap[data.tutorId].enrollmentIds.push(d.id);
                });

            // Fetch paid payouts for total history
            const paidPayoutsSnap = await getDocs(collection(firebaseDb, "payouts"));
            const paidTotals: Record<string, number> = {};
            paidPayoutsSnap.docs.forEach((d) => {
                const data = d.data();
                paidTotals[data.tutorId] = (paidTotals[data.tutorId] ?? 0) + (data.totalAmount ?? 0);
            });

            // Fetch tutor user profiles
            const tutorIds = Object.keys(tutorMap);
            const usersSnap = await getDocs(
                query(collection(firebaseDb, "users"), where("role", "==", "tutor"))
            );

            const usersMap: Record<string, any> = {};
            usersSnap.docs.forEach((d) => { usersMap[d.id] = d.data(); });

            // Build final list — include all tutors with pending OR paid history
            const allTutorIds = new Set([
                ...tutorIds,
                ...Object.keys(paidTotals),
            ]);

            const result: TutorPayout[] = [];
            allTutorIds.forEach((tid) => {
                const u = usersMap[tid];
                if (!u) return;
                result.push({
                    tutorId: tid,
                    tutorName: u.name ?? u.displayName ?? "Unknown Tutor",
                    tutorEmail: u.email ?? "—",
                    bankDetails: u.bankDetails ?? null,
                    pendingEarnings: +(tutorMap[tid]?.pendingEarnings ?? 0).toFixed(2),
                    pendingEnrollmentIds: tutorMap[tid]?.enrollmentIds ?? [],
                    paidTotal: +(paidTotals[tid] ?? 0).toFixed(2),
                });
            });

            result.sort((a, b) => b.pendingEarnings - a.pendingEarnings);
            setTutors(result);

            // Fetch open payout requests from tutors
            const reqSnap = await getDocs(
                query(collection(firebaseDb, "payoutRequests"), where("status", "==", "pending"))
            );
            const openRequests: PayoutRequest[] = reqSnap.docs.map((d) => ({
                id: d.id,
                tutorId: d.data().tutorId,
                tutorName: d.data().tutorName,
                tutorEmail: d.data().tutorEmail,
                totalAmount: d.data().totalAmount,
                bankDetails: d.data().bankDetails ?? null,
                enrollmentIds: d.data().enrollmentIds ?? [],
                requestedAt: d.data().requestedAt,
            }));
            openRequests.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
            setRequests(openRequests);
        } catch (e: any) {
            console.error("Payout fetch error:", e);
            toast.error("Failed to load payout data: " + e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleMarkPaid = async (tutor: TutorPayout, requestId?: string) => {
        const enrollIds = requestId
            ? (requests.find((r) => r.id === requestId)?.enrollmentIds ?? [])
            : tutor.pendingEnrollmentIds;
        if (!enrollIds.length) return;
        const user = firebaseAuth.currentUser;
        if (!user) return;

        setPaying(requestId ?? tutor.tutorId);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/payouts/mark-paid", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    tutorId: tutor.tutorId,
                    payoutIds: enrollIds,
                    note: notes?.[requestId ?? tutor.tutorId] ?? "",
                    requestId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Marked LKR ${data.totalPayout.toLocaleString()} as paid to ${tutor.tutorName}`);
            await fetchPayouts();
        } catch (e: any) {
            toast.error(e.message ?? "Failed to mark as paid");
        } finally {
            setPaying(null);
        }
    };

    const totalPending = tutors.reduce((s, t) => s + t.pendingEarnings, 0);
    const totalPaid = tutors.reduce((s, t) => s + t.paidTotal, 0);

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header */}
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Finance</p>
                <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Tutor Payouts</h1>
                <p className="text-white/60 mt-1">Review and disburse tutor earnings (95% of each sale).</p>
            </div>

            {/* Payout Requests Banner */}
            {requests.length > 0 && (
                <Card className="bg-indigo-500/10 border-indigo-500/30 text-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Bell className="h-4 w-4 text-indigo-400 animate-pulse" />
                            {requests.length} Payout Request{requests.length > 1 ? "s" : ""} Awaiting Action
                        </CardTitle>
                        <CardDescription className="text-indigo-300/70">
                            Tutors have explicitly requested disbursement. Process these first.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-white">{req.tutorName}</p>
                                    <p className="text-xs text-white/50">{req.tutorEmail}</p>
                                    <p className="text-xs text-white/40">
                                        Requested {new Date(req.requestedAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="font-bold text-amber-400 text-lg">
                                            LKR {req.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                        {req.bankDetails ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                                <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Bank set
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                                                <AlertCircle className="mr-1 h-2.5 w-2.5" /> No bank details
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                        disabled={paying === req.id}
                                        onClick={() => handleMarkPaid(
                                            { tutorId: req.tutorId, tutorName: req.tutorName, tutorEmail: req.tutorEmail, bankDetails: req.bankDetails, pendingEarnings: req.totalAmount, pendingEnrollmentIds: req.enrollmentIds, paidTotal: 0 },
                                            req.id
                                        )}
                                    >
                                        {paying === req.id
                                            ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            : <Banknote className="mr-1 h-3 w-3" />}
                                        Mark as Paid
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/50 text-xs uppercase tracking-wider">Total Pending</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            LKR {totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-white/40 mt-1">Awaiting disbursement</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/50 text-xs uppercase tracking-wider">Total Paid Out</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-white/40 mt-1">All time disbursements</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/50 text-xs uppercase tracking-wider">Active Tutors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tutors.length}</div>
                        <p className="text-xs text-white/40 mt-1">With earnings history</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tutor Payout Table */}
            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Payout Queue</CardTitle>
                    <CardDescription className="text-white/50">
                        Tutors with pending earnings. Confirm bank details before disbursing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : tutors.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-white/40 text-sm">
                            No pending payouts.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tutors.map((tutor) => (
                                <Collapsible key={tutor.tutorId}>
                                    <div className="border border-white/10 rounded-xl overflow-hidden">
                                        {/* Row Header */}
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors group">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div>
                                                        <p className="font-semibold text-white">{tutor.tutorName}</p>
                                                        <p className="text-xs text-white/50">{tutor.tutorEmail}</p>
                                                    </div>
                                                    {tutor.bankDetails ? (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hidden sm:flex">
                                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Bank set
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hidden sm:flex">
                                                            <AlertCircle className="mr-1 h-3 w-3" /> No bank
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-amber-400">
                                                            LKR {tutor.pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-[10px] text-white/40">pending</p>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-white/40 group-data-[state=open]:rotate-180 transition-transform" />
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        {/* Expanded Details */}
                                        <CollapsibleContent>
                                            <div className="border-t border-white/10 px-5 py-4 space-y-4 bg-white/[0.02]">
                                                {/* Bank Details */}
                                                {tutor.bankDetails ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-white/10">
                                                                <TableHead className="text-white/50">Account Name</TableHead>
                                                                <TableHead className="text-white/50">Account No.</TableHead>
                                                                <TableHead className="text-white/50">Bank</TableHead>
                                                                <TableHead className="text-white/50">Branch</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow className="border-white/10">
                                                                <TableCell className="text-white font-medium">{tutor.bankDetails.accountName}</TableCell>
                                                                <TableCell className="text-white font-mono">{tutor.bankDetails.accountNumber}</TableCell>
                                                                <TableCell className="text-white">{tutor.bankDetails.bankName}</TableCell>
                                                                <TableCell className="text-white/70">{tutor.bankDetails.branchName || "—"}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-sm text-amber-400/80 flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Tutor has not added bank details yet. Ask them to update their Settings.
                                                    </p>
                                                )}

                                                {/* Summary + Mark Paid */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                                                    <div className="flex-1 space-y-1 text-sm">
                                                        <p className="text-white/60">
                                                            <span className="text-white font-semibold">{tutor.pendingEnrollmentIds.length}</span> pending sale{tutor.pendingEnrollmentIds.length !== 1 ? "s" : ""} ·{" "}
                                                            <span className="text-emerald-400 font-semibold">LKR {tutor.paidTotal.toFixed(2)}</span> paid to date
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <Input
                                                            placeholder="Transfer note (optional)"
                                                            className="h-8 text-xs bg-white/5 border-white/10 text-white w-48"
                                                            value={notes[tutor.tutorId] ?? ""}
                                                            onChange={(e) => setNotes({ ...notes, [tutor.tutorId]: e.target.value })}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                                                            disabled={
                                                                !tutor.pendingEnrollmentIds.length ||
                                                                paying === tutor.tutorId
                                                            }
                                                            onClick={() => handleMarkPaid(tutor)}
                                                        >
                                                            {paying === tutor.tutorId ? (
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Banknote className="mr-1 h-3 w-3" />
                                                            )}
                                                            Mark as Paid
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
