import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Copy, Loader2, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

const EVENT_CATEGORIES = ["community", "arts", "music", "food", "market", "sports", "outdoors", "other"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_email_verification: "Verify organization email",
  pending_admin_review: "Awaiting administrator review",
  pending: "Awaiting administrator review",
  verified: "Verified organization",
  approved: "Approved",
  rejected: "Not approved",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status.replaceAll("_", " ");
  const tone = status === "verified" || status === "approved"
    ? "bg-emerald-100 text-emerald-800"
    : status === "rejected"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-900";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50">
      <div className="container max-w-5xl py-10 sm:py-14">
        <Link href="/activities" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Community discovery
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

export default function OrganizationClaim() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [form, setForm] = useState({
    directoryId: params.get("directoryId") ?? "",
    organizationName: params.get("name") ?? "",
    address: params.get("address") ?? "",
    city: params.get("city") ?? "",
    state: params.get("state") ?? "",
    officialWebsite: "",
    organizationEmail: "",
  });
  const mine = trpc.organizationClaims.mine.useQuery(undefined, { enabled: !!user });
  const request = trpc.organizationClaims.request.useMutation({
    onSuccess: (result) => {
      if (result.status === "pending_email_verification" && result.verificationEmailSent) {
        toast.success("Check the organization email", { description: "Open the verification link, then a Just Putzit administrator will review the request." });
      } else {
        toast.success("Claim request received", { description: "An administrator will review the organization request before access is activated." });
      }
      void mine.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    request.mutate({
      directoryId: form.directoryId.trim() || `manual-${form.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      organizationName: form.organizationName.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      officialWebsite: form.officialWebsite.trim() || undefined,
      organizationEmail: form.organizationEmail.trim(),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow="For community organizations"
        title="Claim your community page"
        description="Congregations, service clubs, and nonprofits can invite people to opt in, share public events, and see only aggregate community totals. Just Putzit never gives an organization member identities, messages, or real-time locations."
      />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Start a claim request</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">An official domain email can verify the request first; every claim still needs administrator approval before it goes live.</p>
              {loading ? (
                <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking your account…</p>
              ) : (
                <form className="mt-6 grid gap-4" onSubmit={submit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="organizationName">Organization name</Label>
                      <Input id="organizationName" value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="organizationEmail">Official organization email</Label>
                      <Input id="organizationEmail" type="email" value={form.organizationEmail} onChange={(event) => setForm({ ...form, organizationEmail: event.target.value })} placeholder="office@organization.org" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="officialWebsite">Official website (recommended)</Label>
                    <Input id="officialWebsite" value={form.officialWebsite} onChange={(event) => setForm({ ...form, officialWebsite: event.target.value })} placeholder="https://organization.org" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Public address</Label>
                    <Input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="WI" />
                    </div>
                  </div>
                  {user ? (
                    <Button type="submit" disabled={request.isPending} className="w-fit rounded-full">
                      {request.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request claim"}
                    </Button>
                  ) : (
                    <Button type="button" className="w-fit rounded-full" onClick={() => { window.location.href = "/login"; }}>Sign in to request claim</Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card className="border-sky-100 bg-sky-50/60 shadow-none">
              <CardContent className="p-5">
                <Users className="h-6 w-6 text-sky-700" />
                <h2 className="mt-3 font-display text-lg font-bold">Built for consent</h2>
                <p className="mt-2 text-sm leading-relaxed text-sky-950">Invite links ask people to opt in themselves. The organization sees counts—not names, profiles, messages, booking history, or real-time location.</p>
              </CardContent>
            </Card>
            <Card className="border-amber-100 bg-amber-50/60 shadow-none">
              <CardContent className="p-5">
                <ShieldCheck className="h-6 w-6 text-amber-700" />
                <h2 className="mt-3 font-display text-lg font-bold">Public events stay reviewed</h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-950">Verified organizers can submit public events. A Just Putzit administrator must approve every listing before it appears in discovery.</p>
              </CardContent>
            </Card>
          </div>
        </div>
        {user && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold">Your organization claims</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {mine.data?.map((claim) => (
                <Card key={claim.id} className="border-border/70">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{claim.organizationName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{claim.city}{claim.state ? `, ${claim.state}` : ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={claim.status} />
                      {claim.status === "verified" && (
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate(`/organization/${claim.id}`)}>Open page</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export function OrganizationClaimVerify() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [verified, setVerified] = useState(false);
  const verify = trpc.organizationClaims.verifyEmail.useMutation({
    onSuccess: () => {
      setVerified(true);
      toast.success("Organization email verified", { description: "The claim is now waiting for Just Putzit administrator approval." });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow="Organization verification"
        title="Confirm your official email"
        description="This confirms control of the organization email. It does not activate the claim or publish anything; a Just Putzit administrator reviews each request."
      />
      <main className="container max-w-xl py-10">
        <Card className="border-emerald-100">
          <CardContent className="p-6 text-center">
            {verified ? (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h2 className="mt-4 font-display text-xl font-bold">Email verified</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your claim is now in the administrator review queue.</p>
                <Link href="/claim"><Button className="mt-5 rounded-full">Back to claims</Button></Link>
              </>
            ) : (
              <>
                <ShieldCheck className="mx-auto h-10 w-10 text-emerald-700" />
                <h2 className="mt-4 font-display text-xl font-bold">Ready to verify</h2>
                <p className="mt-2 text-sm text-muted-foreground">Continue only if you requested this claim from the organization email account.</p>
                <Button className="mt-5 rounded-full" disabled={!token || verify.isPending} onClick={() => verify.mutate({ token })}>
                  {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify organization email"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function OrganizationWorkspace() {
  const { user, loading } = useAuth();
  const params = useParams<{ claimId: string }>();
  const claimId = Number(params.claimId);
  const validId = Number.isInteger(claimId) && claimId > 0;
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "community",
    eventDate: "",
    venueName: "",
    address: "",
    city: "",
    state: "WI",
    isFree: true,
    externalUrl: "",
  });
  const dashboard = trpc.organizationClaims.dashboard.useQuery(
    { claimId },
    { enabled: !!user && validId },
  );
  const createInvite = trpc.organizationClaims.createInviteLink.useMutation({
    onSuccess: (result) => {
      setInviteUrl(result.inviteUrl);
      toast.success("Opt-in invite link created");
      void dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const submitEvent = trpc.organizationClaims.submitPublicEvent.useMutation({
    onSuccess: () => {
      toast.success("Public event sent for administrator approval");
      setEventForm({ title: "", description: "", category: "community", eventDate: "", venueName: "", address: "", city: "", state: "WI", isFree: true, externalUrl: "" });
      void dashboard.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (loading || (user && dashboard.isLoading)) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader eyebrow="Organization page" title="Sign in to continue" description="Organization tools are available only to the person who submitted the approved claim." />
        <main className="container max-w-xl py-10"><Link href="/login"><Button className="rounded-full">Sign in</Button></Link></main>
      </div>
    );
  }
  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader eyebrow="Organization page" title="Page unavailable" description="Only the claim requester can open this organization workspace." />
        <main className="container max-w-xl py-10"><Link href="/claim"><Button className="rounded-full">View my claims</Button></Link></main>
      </div>
    );
  }

  const { claim, aggregate, submissions } = dashboard.data;
  const totals = [
    ["Opt-in members", aggregate.optInMembers],
    ["Invite links", aggregate.inviteLinks],
    ["Approved events", aggregate.approvedEvents],
    ["Public RSVPs", aggregate.publicRsvps],
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow="Verified organization workspace"
        title={claim.organizationName}
        description="Invite people to opt in, submit public events for review, and see community-level totals. Individual member information is never available here."
      />
      <main className="container max-w-5xl py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={claim.status} />
          <Link href="/claim" className="text-sm font-semibold text-primary hover:underline">All claim requests</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="font-display text-3xl font-bold">{value}</p><p className="text-xs font-semibold text-muted-foreground">{label}</p></CardContent></Card>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold"><Users className="h-5 w-5 text-sky-700" /> Invite people to opt in</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This does not enroll anyone automatically. A person chooses whether to join after opening the link.</p>
              <Button className="mt-4 rounded-full" disabled={createInvite.isPending} onClick={() => createInvite.mutate({ claimId: claim.id })}>
                {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create invite link"}
              </Button>
              {inviteUrl && (
                <div className="mt-4 rounded-xl bg-muted/60 p-3">
                  <p className="break-all text-xs text-muted-foreground">{inviteUrl}</p>
                  <Button type="button" size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => { void navigator.clipboard.writeText(inviteUrl); toast.success("Invite link copied"); }}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
                  </Button>
                </div>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">You see totals only. You cannot view the people behind those totals.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Submit a public event</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Public, future events only. They appear only after Just Putzit administrator approval.</p>
              <form className="mt-4 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                submitEvent.mutate({
                  claimId: claim.id,
                  title: eventForm.title,
                  description: eventForm.description || undefined,
                  category: eventForm.category as (typeof EVENT_CATEGORIES)[number],
                  eventDate: new Date(eventForm.eventDate).toISOString(),
                  venueName: eventForm.venueName || undefined,
                  address: eventForm.address || undefined,
                  city: eventForm.city,
                  state: eventForm.state,
                  isFree: eventForm.isFree,
                  externalUrl: eventForm.externalUrl || undefined,
                });
              }}>
                <Input aria-label="Event title" placeholder="Event title" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select aria-label="Event category" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={eventForm.category} onChange={(event) => setEventForm({ ...eventForm, category: event.target.value })}>
                    {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}
                  </select>
                  <Input aria-label="Event date" type="datetime-local" value={eventForm.eventDate} onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })} required />
                </div>
                <Input aria-label="Public venue name" placeholder="Public venue name" value={eventForm.venueName} onChange={(event) => setEventForm({ ...eventForm, venueName: event.target.value })} />
                <Input aria-label="Public venue address" placeholder="Public venue address" value={eventForm.address} onChange={(event) => setEventForm({ ...eventForm, address: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                  <Input aria-label="City" placeholder="City" value={eventForm.city} onChange={(event) => setEventForm({ ...eventForm, city: event.target.value })} required />
                  <Input aria-label="State" value={eventForm.state} onChange={(event) => setEventForm({ ...eventForm, state: event.target.value })} required />
                </div>
                <Input aria-label="Official event page" placeholder="https://organization.org/events" value={eventForm.externalUrl} onChange={(event) => setEventForm({ ...eventForm, externalUrl: event.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={eventForm.isFree} onCheckedChange={(checked) => setEventForm({ ...eventForm, isFree: checked === true })} />
                  Free public event
                </label>
                <Button type="submit" className="w-fit rounded-full" disabled={submitEvent.isPending}>
                  {submitEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send for approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <section className="mt-8">
          <h2 className="font-semibold">Submitted public events</h2>
          {submissions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No public events have been submitted yet.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{submission.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(submission.eventDate).toLocaleString()} · {submission.city}</p>
                    </div>
                    <StatusBadge status={submission.status === "pending" ? "pending_admin_review" : submission.status} />
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

export function JoinOrganization() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [confirmed, setConfirmed] = useState(false);
  const invite = trpc.organizationClaims.getInvite.useQuery(
    { inviteCode: inviteCode ?? "" },
    { enabled: !!inviteCode, retry: false },
  );
  const accept = trpc.organizationClaims.acceptInvite.useMutation({
    onSuccess: (result) => {
      toast.success(`You opted in to ${result.organizationName}`);
      navigate("/activities");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow="Opt-in community invite"
        title={invite.data ? `Join ${invite.data.organizationName} on your terms` : "Community invite"}
        description="This invitation never shares your profile, messages, bookings, or real-time location with the organization. You choose whether to opt in."
      />
      <main className="container max-w-xl py-10">
        <Card className="border-emerald-100">
          <CardContent className="p-6">
            {invite.isLoading || loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading invite…</p>
            ) : invite.isError || !invite.data ? (
              <>
                <h2 className="font-display text-xl font-bold">Invite unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">This link may have expired or the organization is no longer verified.</p>
                <Link href="/activities"><Button variant="outline" className="mt-5 rounded-full">Browse activities</Button></Link>
              </>
            ) : user ? (
              <>
                <h2 className="font-display text-xl font-bold">Choose to opt in</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Joining lets Just Putzit count your opt-in anonymously for {invite.data.organizationName}. The organization does not receive your name, profile, messages, attendance, or location.</p>
                <label className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
                  <Checkbox checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />
                  I understand this is voluntary and I want to opt in to this organization’s Just Putzit community.
                </label>
                <Button className="mt-5 rounded-full" disabled={!confirmed || accept.isPending} onClick={() => accept.mutate({ inviteCode: inviteCode ?? "", confirmed: true })}>
                  {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opt in"}
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold">You are in control</h2>
                <p className="mt-2 text-sm text-muted-foreground">Create a free account first. You will still be asked to choose whether to opt in after you sign in.</p>
                <Link href="/signup"><Button className="mt-5 rounded-full">Join free to continue</Button></Link>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
