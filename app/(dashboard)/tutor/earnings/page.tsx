"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, Banknote } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface EarningSummary {
    pendingAmount: number;
    totalEarned: number;
    pendingCount: number;
    hasBankDetails: boolean;
    hasOpenRequest: boolean;
}

interface PayoutRecord {
    id: string;
    totalAmount: number;
    status: "pending" | "paid";
    requestedAt: string;
    processedAt?: string;
}

export default function TutorEarningsPage() {
    const [summary, setSummary] = useState<EarningSummary | null>(null);
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const user = firebaseAuth.currentUser;
        if (!user) { setLoading(false); return; }

        try {
            // Single query — fetch ALL paid enrollments, split client-side.
            // Firestore's `!= true` skips docs where the field is absent (legacy enrollments),
            // so we must filter in JS instead.
            const [allEnrollSnap, userSnap, requestSnap] = await Promise.all([
                getDocs(query(
                    collection(firebaseDb, "enrollments"),
                    where("tutorId", "==", user.uid),
                    where("status", "==", "paid")
                )),
                // User profile for bank details
                getDocs(query(
                    collection(firebaseDb, "users"),
                    where("__name__", "==", user.uid)
                )),
                // Payout request history
                getDocs(query(
                    collection(firebaseDb, "payoutRequests"),
                    where("tutorId", "==", user.uid)
                )),
            ]);

            // Split: undisbursed = pending, disbursed = already paid out
            const undisbursed = allEnrollSnap.docs.filter((d) => !d.data().disbursed);
            const disbursed   = allEnrollSnap.docs.filter((d) =>  d.data().disbursed === true);

            const pendingAmount = +undisbursed
                .reduce((s, d) => s + (d.data().tutorShare ?? 0), 0)
                .toFixed(2);
            const totalEarned = +disbursed
                .reduce((s, d) => s + (d.data().tutorShare ?? 0), 0)
                .toFixed(2);

            const userProfile = userSnap.empty
                ? null
                : (await import("firebase/firestore").then(({ doc, getDoc }) =>
                    getDoc(doc(firebaseDb, "users", user.uid))
                )).data();

            const allRequests: PayoutRecord[] = requestSnap.docs
                .map((d) => ({
                    id: d.id,
                    totalAmount: d.data().totalAmount ?? 0,
                    status: d.data().status,
                    requestedAt: d.data().requestedAt,
                    processedAt: d.data().processedAt,
                }))
                .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

            const hasOpenRequest = allRequests.some((r) => r.status === "pending");

            setSummary({
                pendingAmount,
                totalEarned,
                pendingCount: undisbursed.length,
                hasBankDetails: !!userProfile?.bankDetails?.accountNumber,
                hasOpenRequest,
            });
            setPayouts(allRequests);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load earnings data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsub = firebaseAuth.onAuthStateChanged(() => fetchData());
        return () => unsub();
    }, [fetchData]);

    const handleRequestPayout = async () => {
        const user = firebaseAuth.currentUser;
        if (!user) return;
        setRequesting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/tutor/request-payout", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(
                `Payout request submitted for LKR ${data.totalAmount.toLocaleString()}. Admin will process it shortly.`
            );
            await fetchData();
        } catch (e: any) {
            toast.error(e.message ?? "Failed to submit payout request.");
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    const canRequest =
        summary &&
        summary.pendingAmount > 0 &&
        summary.hasBankDetails &&
        !summary.hasOpenRequest;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header */}
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Finance</p>
                <h1 className="text-3xl font-bold tracking-tight mt-1">Earnings</h1>
                <p className="text-muted-foreground mt-1">Track your course revenue and request payouts.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card border-border/60">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Pending Earnings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            LKR {(summary?.pendingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.pendingCount ?? 0} sales awaiting payout
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/60">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" /> Total Earned
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            LKR {(summary?.totalEarned ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All time disbursed to you</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/60">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" /> Payout Status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {summary?.hasOpenRequest ? (
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Clock className="h-5 w-5" />
                                <span className="font-semibold">Request Pending</span>
                            </div>
                        ) : summary?.hasBankDetails ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-semibold">Bank details set</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-semibold">No bank details</span>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.hasOpenRequest
                                ? "Admin will process your request"
                                : summary?.hasBankDetails
                                ? "Ready to request payout"
                                : "Add bank details in Settings first"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts / CTA */}
            {!summary?.hasBankDetails && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                        You haven&apos;t added your bank account details yet.
                        Payouts can&apos;t be processed without them.
                    </div>
                    <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                        <Link href="/tutor/settings">Add Bank Details</Link>
                    </Button>
                </div>
            )}

            {summary?.hasOpenRequest && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-indigo-300 text-sm">
                    <Clock className="h-5 w-5 shrink-0" />
                    You have a payout request pending review by the platform admin.
                    You&apos;ll be notified once it&apos;s processed.
                </div>
            )}

            {/* Request Payout Button */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={!canRequest || requesting}
                    >
                        {requesting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                        ) : (
                            <><Banknote className="mr-2 h-4 w-4" /> Request Payout</>
                        )}
                        {summary?.pendingAmount ? (
                            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                                LKR {summary.pendingAmount.toLocaleString()}
                            </span>
                        ) : null}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Request Payout</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will submit a payout request for{" "}
                            <strong>LKR {summary?.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>{" "}
                            to your registered bank account. The admin will review and transfer the funds.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={handleRequestPayout}
                        >
                            Confirm Request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Payout History */}
            {payouts.length > 0 && (
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base">Payout History</CardTitle>
                        <CardDescription>All your payout requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Requested</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-sm">
                                            {new Date(p.requestedAt).toLocaleDateString("en-LK", {
                                                year: "numeric", month: "short", day: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold">
                                            LKR {p.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    p.status === "paid"
                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                }
                                            >
                                                {p.status === "paid" ? (
                                                    <><CheckCircle2 className="mr-1 h-3 w-3" /> Paid</>
                                                ) : (
                                                    <><Clock className="mr-1 h-3 w-3" /> Pending</>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.processedAt
                                                ? new Date(p.processedAt).toLocaleDateString("en-LK", {
                                                    year: "numeric", month: "short", day: "numeric",
                                                })
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
