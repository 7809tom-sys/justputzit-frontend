import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Loader2, Shield, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function OrganizationClaimAdmin() {
  const { user, loading } = useAuth();
  const queue = trpc.organizationClaims.reviewQueue.useQuery(undefined, { enabled: user?.role === "admin" });
  const utils = trpc.useUtils();
  const reviewClaim = trpc.organizationClaims.reviewClaim.useMutation({
    onSuccess: () => {
      toast.success("Organization claim reviewed");
      void utils.organizationClaims.reviewQueue.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const reviewEvent = trpc.organizationClaims.reviewEvent.useMutation({
    onSuccess: (result) => {
      toast.success(result.publishedEventId ? "Public event approved and published" : "Event submission reviewed");
      void utils.organizationClaims.reviewQueue.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (user?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-6">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 font-display text-2xl font-bold">Administrator access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Organization claims and public event submissions remain in the administrator review queue.</p>
            <Link href="/"><Button className="mt-5 rounded-full">Return home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-r from-amber-50 via-white to-emerald-50">
        <div className="container max-w-5xl py-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Approval queue</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Organization claims & public events</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Approve only after reviewing the organization evidence. Approval activates aggregate-only invite tools; event approval publishes one future public event.</p>
        </div>
      </header>
      <main className="container max-w-5xl space-y-10 py-8">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Organization claims</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{queue.data?.claims.length ?? 0} pending</span>
          </div>
          {queue.isLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading review queue…</p>
          ) : (queue.data?.claims.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No organization claims need review.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {queue.data?.claims.map((claim) => (
                <Card key={claim.id} className="border-amber-100">
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <p className="font-semibold">{claim.organizationName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{claim.address ?? "No public address supplied"} · {claim.city}{claim.state ? `, ${claim.state}` : ""}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Organization email: {claim.organizationEmail} · {claim.emailVerifiedAt ? "email verified" : "email not verified"}</p>
                        {claim.officialWebsite && <a href={claim.officialWebsite} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open stated official site</a>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" className="rounded-full" disabled={reviewClaim.isPending} onClick={() => reviewClaim.mutate({ claimId: claim.id, approved: true })}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" className="rounded-full" disabled={reviewClaim.isPending} onClick={() => reviewClaim.mutate({ claimId: claim.id, approved: false })}><X className="mr-1 h-4 w-4" /> Decline</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Public event submissions</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{queue.data?.submissions.length ?? 0} pending</span>
          </div>
          {(queue.data?.submissions.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No public event submissions need review.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {queue.data?.submissions.map((submission) => (
                <Card key={submission.id} className="border-emerald-100">
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <p className="font-semibold">{submission.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{submission.organizationName} · {new Date(submission.eventDate).toLocaleString()} · {submission.venueName ?? "Public venue not specified"} · {submission.city}, {submission.state}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{submission.description ?? "No description supplied."}</p>
                        {submission.externalUrl && <a href={submission.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open stated official event page</a>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" className="rounded-full" disabled={reviewEvent.isPending} onClick={() => reviewEvent.mutate({ submissionId: submission.id, approved: true })}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" className="rounded-full" disabled={reviewEvent.isPending} onClick={() => reviewEvent.mutate({ submissionId: submission.id, approved: false })}><X className="mr-1 h-4 w-4" /> Decline</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
