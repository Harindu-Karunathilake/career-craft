"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Landmark, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SRI_LANKA_BANKS = [
    "Bank of Ceylon (BOC)",
    "People's Bank",
    "Commercial Bank",
    "Hatton National Bank (HNB)",
    "Sampath Bank",
    "Seylan Bank",
    "Nations Trust Bank (NTB)",
    "Pan Asia Banking Corporation (PABC)",
    "DFCC Bank",
    "National Development Bank (NDB)",
    "Cargills Bank",
    "Amana Bank",
    "Union Bank",
];

interface BankDetails {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
}

export function TutorBankAccountCard() {
    const [details, setDetails] = useState<BankDetails>({
        accountName: "",
        accountNumber: "",
        bankName: "",
        branchName: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
            if (!user) { setLoading(false); return; }
            try {
                const snap = await getDoc(doc(firebaseDb, "users", user.uid));
                if (snap.exists() && snap.data().bankDetails) {
                    setDetails(snap.data().bankDetails);
                }
            } catch (e) {
                console.error("Error fetching bank details:", e);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        const user = firebaseAuth.currentUser;
        if (!user) return;
        if (!details.accountName || !details.accountNumber || !details.bankName) {
            toast.error("Please fill in all required fields.");
            return;
        }
        setSaving(true);
        setSaved(false);
        try {
            await setDoc(
                doc(firebaseDb, "users", user.uid),
                { bankDetails: details },
                { merge: true }
            );
            setSaved(true);
            toast.success("Bank details saved.");
        } catch (e) {
            toast.error("Failed to save bank details.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-emerald-500" />
                    Payout / Bank Account
                </CardTitle>
                <CardDescription>
                    Your earnings (95% of each course sale) will be transferred to this account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {saved && (
                    <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Saved</AlertTitle>
                        <AlertDescription>Bank account details updated successfully.</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Account Holder Name <span className="text-destructive">*</span></Label>
                        <Input
                            placeholder="Full name as per bank records"
                            value={details.accountName}
                            onChange={(e) => setDetails({ ...details, accountName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Account Number <span className="text-destructive">*</span></Label>
                        <Input
                            placeholder="e.g. 0123456789"
                            value={details.accountNumber}
                            onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Bank <span className="text-destructive">*</span></Label>
                        <Select
                            value={details.bankName}
                            onValueChange={(v) => setDetails({ ...details, bankName: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select your bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {SRI_LANKA_BANKS.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Branch Name</Label>
                        <Input
                            placeholder="e.g. Colombo 03"
                            value={details.branchName}
                            onChange={(e) => setDetails({ ...details, branchName: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save Bank Details"}
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Payouts are processed by the platform admin. You&apos;ll be notified when a transfer is made.
                </p>
            </CardContent>
        </Card>
    );
}
