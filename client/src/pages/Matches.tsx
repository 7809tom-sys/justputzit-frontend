import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Heart, MessageCircle, Gamepad2, Sparkles, Users, Shield, Calendar, Scale, ExternalLink, MapPin, Dumbbell } from "lucide-react";
import { EventProposalDialog } from "@/components/EventProposalDialog";
import { MemberSafetyActions } from "@/components/MemberSafetyActions";
import { AdvisorAvatar } from "@/components/AdvisorAvatar";

export default function Matches() {
  const [, navigate] = useLocation();
  const { data: myMatches, isLoading, refetch } = trpc.matchmaking.getMyMatches.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const findMatches = trpc.matchmaking.findMatches.useMutation({
    onSuccess: data => {
      if (data.preferenceRequired) {
        toast.info("Choose a connection preference first", { description: "Open your profile and opt into friendship, dating, or Gym Buddy when you are ready." });
      } else if (data.matches.length > 0) {
        toast.success(`Sally found ${data.matches.length} new match${data.matches.length !== 1 ? "es" : ""}! 🎉`);
        refetch();
      } else {
        toast.info("No new matches right now — keep chatting with Sally to improve your profile!");
      }
    },
    onError: () => toast.error("Couldn't find matches. Please try again."),
  });

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Your Matches 💕</h1>
            <p className="text-muted-foreground mt-1">Sally-powered compatibility matching</p>
          </div>
          <Button
            className="gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
            onClick={() => findMatches.mutate()}
            disabled={findMatches.isPending}
          >
            <Sparkles className="w-4 h-4" />
            {findMatches.isPending ? "Finding..." : "Find Matches"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : myMatches && myMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myMatches.map(match => (
              <MatchCard key={match.id} match={match} navigate={navigate} city={profile?.city} myProfile={profile} onBlocked={refetch} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <AdvisorAvatar size="lg" className="mx-auto mb-4 animate-float" />
            <h2 className="font-display font-bold text-2xl mb-3">No matches yet!</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Have a chat with Sally so she can get to know your preferences, then she’ll look for thoughtful connections and public activities that fit you.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/interview")}>
                <MessageCircle className="w-4 h-4" /> Chat with Sally
              </Button>
              <Button
                className="gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
                onClick={() => findMatches.mutate()}
                disabled={findMatches.isPending}
              >
                <Sparkles className="w-4 h-4" /> Find Matches
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, navigate, city, myProfile, onBlocked }: { match: any; navigate: any; city?: string | null; myProfile?: any; onBlocked: () => void }) {
  const profile = match.otherProfile;
  const traits = profile?.traits as any;
  const isGymBuddyPair = myProfile?.traits?.connectionPreferences?.gymBuddy === true && traits?.connectionPreferences?.gymBuddy === true;
  const { data: nearbyActivities = [] } = trpc.activityBoard.getAll.useQuery({ city: city || undefined, radiusMiles: 25 }, { enabled: Boolean(city) });
  const localMeetupSpot = nearbyActivities.find((activity: any) =>
    (activity.category === "dining" || activity.category === "coffee") &&
    activity.venueIsLocallyOwned &&
    activity.venueName &&
    activity.venueWebsite,
  );
  const sendWyrChallenge = trpc.wyr.sendChallenge.useMutation({
    onSuccess: (data) => {
      if (!data.challenge?.id) {
        toast.error("The challenge could not be created. Please try again.");
        return;
      }
      toast.success("Your private challenge is ready.");
      navigate(`/wyr-challenge/${data.challenge.id}`);
    },
    onError: () => toast.error("This challenge is available only with this existing match."),
  });

  return (
    <div className="relative bg-white rounded-3xl shadow-sm border border-border p-6 card-hover">
      {match.otherUserId && <div className="absolute right-3 top-3"><MemberSafetyActions targetUserId={match.otherUserId} targetName={profile?.displayName || "this member"} compact onBlocked={onBlocked} /></div>}
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md flex-shrink-0"
          style={{ background: profile?.avatarColor || "#f97316" }}
        >
          {profile?.avatarEmoji || "😊"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-lg truncate">{profile?.displayName || "Mystery Match"}</p>
            {profile?.isVerified && (
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-primary font-bold text-sm">{match.compatibilityScore}% compatible</span>
          </div>
        </div>
      </div>

      {/* Compatibility reason */}
      {match.compatibilityReason && (
        <div className="bg-primary/5 rounded-xl p-3 mb-4 text-xs text-foreground/80 italic border border-primary/10">
          <span className="font-semibold text-primary not-italic">Sally’s local read: </span>
          {match.compatibilityReason}
        </div>
      )}

      {/* Traits */}
      {traits?.personalityKeywords && (
        <div className="flex flex-wrap gap-1 mb-4">
          {traits.personalityKeywords.slice(0, 4).map((k: string) => (
            <Badge key={k} variant="secondary" className="text-xs rounded-full">{k}</Badge>
          ))}
        </div>
      )}

      {/* Network badge */}
      <Badge variant="outline" className="mb-4 text-xs capitalize rounded-full">
        {profile?.networkType === "singles" ? "💙" : profile?.networkType === "couples" ? "💚" : "🧡"} {profile?.networkType || "singles"} Network
      </Badge>

      {/* Event interests badge (placeholder for Phase 3) */}
      <div className="mb-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="w-3 h-3" />
          Interested in events
        </span>
      </div>

      <section className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-3" aria-label="Sally's local meetup suggestion">
        <div className="flex items-start gap-2">
          {isGymBuddyPair ? <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" /> : <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">{isGymBuddyPair ? "Sally’s workout plan" : "Sally’s place idea"}</p>
            {isGymBuddyPair ? <>
              <p className="mt-1 font-semibold text-foreground">Choose a public gym session together</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">You both chose Gym Buddy. Pick a gym you can independently access, agree on a public time, and use the gym’s rules before you meet.</p>
              <Button size="sm" variant="outline" className="mt-2 h-7 rounded-full border-orange-200 bg-white text-xs text-orange-800 hover:bg-orange-100" onClick={() => navigate("/gym-buddy")}>Explore Gym Buddy</Button>
            </> : localMeetupSpot ? <>
              <p className="mt-1 font-semibold text-foreground">{localMeetupSpot.venueName}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">A source-backed, locally owned {localMeetupSpot.category === "coffee" ? "coffee spot" : "dining spot"}{localMeetupSpot.venueCity ? ` in ${localMeetupSpot.venueCity}` : ""}. Choose a public time only when you both feel comfortable.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 rounded-full border-teal-200 bg-white text-xs text-teal-800 hover:bg-teal-100" onClick={() => navigate(`/activities/${localMeetupSpot.id}`)}>View place</Button>
                <a href={localMeetupSpot.venueWebsite ?? undefined} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-full border border-teal-200 bg-white px-2.5 text-xs font-medium text-teal-800 hover:bg-teal-100">Official site <ExternalLink className="h-3 w-3" /></a>
              </div>
            </> : <>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Sally has not found an independently documented local café or dining spot in this area yet. Browse public activities or choose an official event instead.</p>
              <Button size="sm" variant="outline" className="mt-2 h-7 rounded-full border-teal-200 bg-white text-xs text-teal-800 hover:bg-teal-100" onClick={() => navigate("/activities")}>Browse local places</Button>
            </>}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          className="gradient-sally text-white border-0 rounded-xl btn-scale gap-1.5"
          onClick={() => navigate(`/chat/${match.id}`)}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Say hello
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl gap-1.5"
          onClick={() => navigate(`/games/${match.id}`)}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> Games
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
          disabled={!match.otherUserId || sendWyrChallenge.isPending}
          onClick={() => sendWyrChallenge.mutate({ challengedId: match.otherUserId, matchId: match.id })}
        >
          <Scale className="w-3.5 h-3.5" /> WYR
        </Button>
      </div>
      <EventProposalDialog
        matchId={match.id}
        matchName={profile?.displayName || "your match"}
        city={city}
        trigger={<Button size="sm" variant="outline" className="mt-2 w-full rounded-xl border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"><Calendar className="mr-1.5 h-3.5 w-3.5" />Choose a public plan</Button>}
      />
    </div>
  );
}
