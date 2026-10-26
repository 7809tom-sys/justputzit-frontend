import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, MapPin, Users, Sparkles, Shield, MessageCircle, ChevronRight, Star, Smartphone, Share2, MoreVertical, Plus, Megaphone, GripVertical, Settings2, X, Radio, RotateCcw, Calendar, CalendarPlus, Navigation, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef, useCallback } from "react";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { WaukeshaLibrarySpotlight } from "@/components/WaukeshaLibrarySpotlight";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import { useUserCity } from "@/hooks/useUserCity";
import { toggleHomepageSection } from "@shared/homepageLayout";
import { filterHomepageDiscovery, type HomepageDiscoveryDateRange, type HomepageDiscoverySort } from "@shared/homepageDiscovery";
import { formatMilesAway, haversineDistanceMiles } from "@shared/geo";
import { buildTodayPlanSelection } from "@shared/todaysPlan";
import { TodayPlanInviteDialog } from "@/components/TodayPlanInviteDialog";
import { AdvisorAvatar } from "@/components/AdvisorAvatar";

// ─── Module definitions ───────────────────────────────────────────────────────

interface ModuleDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  defaultPinned: boolean;
  defaultPosition: number;
}

const ALL_MODULES: ModuleDef[] = [
  { id: "sally",      label: "Chat with Sally",    emoji: "👵", description: "Your friendly local advisor",         defaultPinned: true,  defaultPosition: 0 },
  { id: "matches",    label: "My Matches",          emoji: "💕", description: "See your connections",            defaultPinned: true,  defaultPosition: 1 },
  { id: "activities", label: "Local Activities",    emoji: "🗺️", description: "Discover nearby events",         defaultPinned: true,  defaultPosition: 2 },
  { id: "gymbuddy",   label: "Gym Buddy",           emoji: "🏋️", description: "Find a workout partner and plan a public session", defaultPinned: true,  defaultPosition: 3 },
  { id: "sports",     label: "Sports & Live Scores",emoji: "🏟️", description: "Game Day Chat & live scores",    defaultPinned: true,  defaultPosition: 4 },
  { id: "games",      label: "Games Hub",           emoji: "🎮", description: "Trivia, Jeopardy & more",        defaultPinned: true,  defaultPosition: 5 },
  { id: "community",  label: "Community",           emoji: "👥", description: "Groups & local events",          defaultPinned: false, defaultPosition: 6 },
  { id: "concierge",  label: "Concierge",           emoji: "🎩", description: "AI-planned date nights",         defaultPinned: false, defaultPosition: 7 },
  { id: "marketplace",label: "Marketplace",         emoji: "🛍️", description: "Local deals & services",        defaultPinned: false, defaultPosition: 8 },
  { id: "family",     label: "Family Connect",      emoji: "👨‍👩‍👧", description: "Meet families nearby",         defaultPinned: false, defaultPosition: 9 },
  { id: "trip",       label: "Trip Planner",        emoji: "✈️", description: "Plan adventures together",       defaultPinned: false, defaultPosition: 10 },
  { id: "shoutout",   label: "Shout Out",           emoji: "📣", description: "Refer friends & earn rewards",   defaultPinned: true,  defaultPosition: 11 },
  { id: "localevents",label: "Local Events",         emoji: "🏙️", description: "Museum, library & community events", defaultPinned: false, defaultPosition: 12 },
];

interface ActiveModule {
  moduleId: string;
  position: number;
  pinned: boolean;
}

function buildLayout(savedModules: ActiveModule[]): ActiveModule[] {
  if (savedModules.length === 0) {
    return ALL_MODULES.map(m => ({ moduleId: m.id, position: m.defaultPosition, pinned: m.defaultPinned }));
  }
  // Merge saved with defaults for any new modules not yet in DB
  const savedIds = new Set(savedModules.map(m => m.moduleId));
  const missing = ALL_MODULES.filter(m => !savedIds.has(m.id)).map(m => ({
    moduleId: m.id,
    // Gym Buddy is an intentional new primary pathway; other new modules stay unobtrusive.
    position: m.id === "gymbuddy" ? m.defaultPosition : m.defaultPosition + 100,
    pinned: m.defaultPinned,
  }));
  return [...savedModules, ...missing].sort((a, b) => a.position - b.position);
}

// ─── Module card renderers ────────────────────────────────────────────────────

function SallyModule({ profile, navigate }: { profile: any; navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-start gap-4">
      <AdvisorAvatar size="md" className="animate-pulse-ring" />
      <div className="flex-1">
        <p className="font-bold text-foreground mb-1">Sally says hi! 👋</p>
        <p className="text-muted-foreground text-sm mb-3">
          {profile?.interviewCount === 0
            ? "I can't wait to get to know you! Let's start with a quick 90-second chat."
            : "Great to see you again! I have new questions to refine your profile."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gradient-sally text-white border-0 rounded-full gap-2 btn-scale" onClick={() => navigate("/interview")}>
            <MessageCircle className="w-4 h-4" /> Chat with Sally
          </Button>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => navigate("/horoscope")}>
            <Sparkles className="h-3.5 w-3.5" /> Read today’s horoscope
          </Button>
        </div>
      </div>
    </div>
  );
}

function MatchesModule({ matches, navigate }: { matches: any[]; navigate: (p: string) => void }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xl">My Matches</h2>
        </div>
        <p className="text-muted-foreground text-sm">No matches yet — keep chatting with Sally to improve your profile!</p>
        <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => navigate("/matches")}>Browse Matches</Button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">My Matches</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/matches")}>
          See all <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.slice(0, 3).map((match: any) => (
          <MatchCard key={match.id} match={match} onChat={() => navigate(`/chat/${match.id}`)} />
        ))}
      </div>
    </div>
  );
}

function GymBuddyModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">🏋️</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-100">Fitness, your way</p>
          <h2 className="mt-1 font-display text-xl font-bold">Gym Buddy</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/85">Find a workout partner at your gym, plan a session together, or keep building your own program.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full bg-white text-orange-700 hover:bg-orange-50" onClick={() => navigate("/gym-buddy")}>
              Find a workout partner <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("/my-workout")}>
              My workout program
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryFilters({
  dateRange,
  category,
  sortBy,
  onDateChange,
  onCategoryChange,
  onSortChange,
  categories,
  radiusMiles,
  onRadiusChange,
}: {
  dateRange: HomepageDiscoveryDateRange;
  category: string;
  sortBy: HomepageDiscoverySort;
  onDateChange: (value: HomepageDiscoveryDateRange) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: HomepageDiscoverySort) => void;
  categories: Array<{ value: string; label: string }>;
  radiusMiles?: number;
  onRadiusChange?: (value: number) => void;
}) {
  const selectClass = "rounded-full border border-white/25 bg-white/15 px-2.5 py-1.5 text-xs text-white outline-none [&>option]:text-foreground";
  return (
    <div className="flex flex-wrap gap-2 mt-4" onClick={(event) => event.stopPropagation()}>
      <select aria-label="Filter by date" value={dateRange} onChange={(event) => onDateChange(event.target.value as HomepageDiscoveryDateRange)} className={selectClass}>
        <option value="all">Any date</option>
        <option value="week">Next 7 days</option>
        <option value="month">Next 30 days</option>
      </select>
      <select aria-label="Filter by category" value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass}>
        {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <select aria-label="Sort discovery results" value={sortBy} onChange={(event) => onSortChange(event.target.value as HomepageDiscoverySort)} className={selectClass}>
        <option value="date">Sort: date</option>
        <option value="category">Sort: category</option>
      </select>
      {radiusMiles !== undefined && onRadiusChange && (
        <select aria-label="Homepage discovery radius" value={radiusMiles} onChange={(event) => onRadiusChange(Number(event.target.value))} className={selectClass}>
          <option value={10}>Within 10 mi</option>
          <option value={25}>Within 25 mi</option>
          <option value={50}>Within 50 mi</option>
        </select>
      )}
    </div>
  );
}

function ActivitiesModule({ navigate }: { navigate: (p: string) => void }) {
  const [dateRange, setDateRange] = useState<HomepageDiscoveryDateRange>("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<HomepageDiscoverySort>("date");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const { detectedCity } = useUserCity();
  const userLat = detectedCity?.lat;
  const userLng = detectedCity?.lng;
  const { data: activities = [], isLoading } = trpc.activityBoard.getAll.useQuery({
    city: detectedCity?.city,
    lat: userLat,
    lng: userLng,
    radiusMiles,
  });
  const filtered = filterHomepageDiscovery(activities, { dateRange, category, sortBy }).slice(0, 2);
  const categories = [
    { value: "all", label: "All activities" },
    { value: "sports", label: "Sports" },
    { value: "outdoors", label: "Outdoors" },
    { value: "fitness", label: "Fitness" },
    { value: "arts", label: "Arts" },
    { value: "community", label: "Community" },
  ];

  return (
    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 card-hover" onClick={() => navigate("/activities")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Discover</p>
          <h2 className="font-display font-bold text-2xl text-white">Local Activities</h2>
          <p className="text-white/70 text-sm mt-1">Events, outings & meetups near you</p>
        </div>
        <div className="text-5xl">🗺️</div>
      </div>
      <DiscoveryFilters dateRange={dateRange} category={category} sortBy={sortBy} onDateChange={setDateRange} onCategoryChange={setCategory} onSortChange={setSortBy} categories={categories} radiusMiles={userLat !== undefined && userLng !== undefined ? radiusMiles : undefined} onRadiusChange={setRadiusMiles} />
      <div className="mt-3 space-y-2">
        {isLoading && <p className="text-xs text-white/70">Finding activities near you…</p>}
        {!isLoading && filtered.map((activity: any) => (
          <button key={activity.id} type="button" className="w-full text-left rounded-2xl bg-white/15 hover:bg-white/25 p-3 text-white transition-colors" onClick={(event) => { event.stopPropagation(); navigate(`/activities/${activity.id}`); }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{activity.title}</span>
              <span className="text-[11px] text-white/70 whitespace-nowrap">{activity.category ?? "Activity"}</span>
            </div>
            <p className="text-xs text-white/70 mt-1">{activity.eventDate ? new Date(activity.eventDate).toLocaleDateString() : "Flexible date"}{activity.venueCity ? ` · ${activity.venueCity}` : ""}{(activity as any).distanceMiles != null ? ` · ${formatMilesAway((activity as any).distanceMiles)}` : userLat !== undefined && userLng !== undefined && (activity as any).venueLat != null && (activity as any).venueLng != null ? ` · ${formatMilesAway(haversineDistanceMiles(userLat, userLng, Number((activity as any).venueLat), Number((activity as any).venueLng)))}` : ""}</p>
          </button>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-xs text-white/70">No activities match those filters.</p>}
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(event) => { event.stopPropagation(); navigate("/activities"); }}>
        Explore all <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function SportsModule({ navigate }: { navigate: (p: string) => void }) {
  const { data: liveData } = trpc.sportsScores.getLiveGames.useQuery(undefined, { refetchInterval: 60000 });
  const liveCount = liveData?.games?.length ?? 0;
  return (
    <div
      className="bg-gradient-to-br from-slate-800 to-green-900 rounded-3xl p-6 cursor-pointer card-hover"
      onClick={() => navigate("/sports")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white/80 text-sm font-medium">Sports</p>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-red-500/30 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> {liveCount} live
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Game Day Chat</h2>
          <p className="text-white/70 text-sm mt-1">Live scores, chat rooms & trivia</p>
        </div>
        <div className="text-5xl">🏟️</div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(e) => { e.stopPropagation(); navigate("/sports/live-scores"); }}>
          <Radio className="w-3 h-3" /> Live Scores
        </Button>
        <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-full" onClick={(e) => { e.stopPropagation(); navigate("/sports"); }}>
          Chat Rooms
        </Button>
      </div>
    </div>
  );
}

function GamesModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 cursor-pointer card-hover"
      onClick={() => navigate("/games-hub")}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Play</p>
          <h2 className="font-display font-bold text-2xl text-white">Games Hub</h2>
          <p className="text-white/70 text-sm mt-1">Trivia, Jeopardy, Bulger Dash & more</p>
        </div>
        <div className="text-5xl">🎮</div>
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2">
        Play Now <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function CommunityModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/community")}>
      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl flex-shrink-0">👥</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Community</h2>
        <p className="text-muted-foreground text-sm">Join groups & local events</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function ConciergeModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/concierge")}>
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl flex-shrink-0">🎩</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Concierge</h2>
        <p className="text-muted-foreground text-sm">AI-planned date nights & outings</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function MarketplaceModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/marketplace")}>
      <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-3xl flex-shrink-0">🛍️</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Marketplace</h2>
        <p className="text-muted-foreground text-sm">Local deals & services</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function FamilyModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/family")}>
      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl flex-shrink-0">👨‍👩‍👧</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Family Connect</h2>
        <p className="text-muted-foreground text-sm">Meet families nearby</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function TripModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/trip-planner")}>
      <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl flex-shrink-0">✈️</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Trip Planner</h2>
        <p className="text-muted-foreground text-sm">Plan adventures together</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function LocalEventsModule({ navigate }: { navigate: (p: string) => void }) {
  const { city, detectedCity } = useUserCity();
  const [dateRange, setDateRange] = useState<HomepageDiscoveryDateRange>("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<HomepageDiscoverySort>("date");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const userLat = detectedCity?.lat;
  const userLng = detectedCity?.lng;
  const hasGps = userLat !== undefined && userLng !== undefined;
  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    city: hasGps ? undefined : city,
    lat: hasGps ? userLat : undefined,
    lng: hasGps ? userLng : undefined,
    radiusMiles: hasGps ? radiusMiles : undefined,
    limit: 30,
  });
  const filtered = filterHomepageDiscovery(events, { dateRange, category, sortBy }).slice(0, 2);
  const categories = [
    { value: "all", label: "All events" },
    { value: "plays", label: "Plays & musicals" },
    { value: "arts", label: "Arts" },
    { value: "music", label: "Music" },
    { value: "community", label: "Community" },
    { value: "outdoors", label: "Outdoors" },
  ];

  return (
    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 card-hover" onClick={() => navigate("/events")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-white/70" />
            <p className="text-white/80 text-sm font-medium">{city}</p>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Local Events</h2>
          <p className="text-white/70 text-sm mt-1">Plays, concerts, museums & community events</p>
        </div>
        <div className="text-5xl">🏙️</div>
      </div>
      <DiscoveryFilters dateRange={dateRange} category={category} sortBy={sortBy} onDateChange={setDateRange} onCategoryChange={setCategory} onSortChange={setSortBy} categories={categories} radiusMiles={hasGps ? radiusMiles : undefined} onRadiusChange={setRadiusMiles} />
      <div className="mt-3 space-y-2">
        {isLoading && <p className="text-xs text-white/70">Finding current events near you…</p>}
        {!isLoading && filtered.map((event: any) => (
          <button key={event.id} type="button" className="w-full text-left rounded-2xl bg-white/15 hover:bg-white/25 p-3 text-white transition-colors" onClick={(clickEvent) => { clickEvent.stopPropagation(); navigate("/events"); }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{event.title}</span>
              <span className="text-[11px] text-white/70 whitespace-nowrap">{event.category ?? "Event"}</span>
            </div>
            <p className="text-xs text-white/70 mt-1">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Date to be announced"}{event.venueName ? ` · ${event.venueName}` : ""}{hasGps && event.lat != null && event.lng != null ? ` · ${formatMilesAway(haversineDistanceMiles(userLat, userLng, Number(event.lat), Number(event.lng)))}` : ""}</p>
          </button>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-xs text-white/70">No events match those filters.</p>}
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(event) => { event.stopPropagation(); navigate("/events"); }}>
        <Calendar className="w-3.5 h-3.5" /> Browse all <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function ShoutoutModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div
      className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 flex items-center gap-4 cursor-pointer card-hover"
      onClick={() => navigate("/shout-out")}
    >
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Megaphone className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-white text-base">Refer a Friend 🎉</p>
        <p className="text-white/80 text-sm">Invite friends from your contacts</p>
      </div>
      <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
    </div>
  );
}

type NearbyDiscoveryItem = {
  id: number;
  kind: "event" | "activity";
  title: string;
  description?: string | null;
  category?: string | null;
  eventDate?: Date | string | null;
  endDate?: Date | string | null;
  venueName?: string | null;
  venueCity?: string | null;
  address?: string | null;
  externalUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceMiles?: number | null;
  venueWebsite?: string | null;
  venueIsLocallyOwned?: boolean | null;
  venueOwnershipNote?: string | null;
  source?: string | null;
};

function calendarDate(value: Date | string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function getCalendarUrl(item: NearbyDiscoveryItem) {
  if (!item.eventDate) return null;
  const start = new Date(item.eventDate);
  const end = item.endDate ? new Date(item.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: `${calendarDate(start)}/${calendarDate(end)}`,
    details: `Found on Just Putzit${item.externalUrl ? `\\n${item.externalUrl}` : ""}`,
    location: [item.venueName, item.address, item.venueCity].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getDirectionsUrl(item: NearbyDiscoveryItem) {
  const destination = item.lat != null && item.lng != null ? `${item.lat},${item.lng}` : [item.venueName, item.address, item.venueCity].filter(Boolean).join(", ");
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}

function getEventSourceStatus(item: NearbyDiscoveryItem) {
  if (item.externalUrl) return { label: "Official source", detail: "Official venue or event page available", className: "bg-emerald-100 text-emerald-800" };
  if (item.source === "community") return { label: "Community submitted", detail: "Confirm details with the venue", className: "bg-amber-100 text-amber-900" };
  return { label: "Community listing", detail: "Confirm details with the venue", className: "bg-slate-100 text-slate-700" };
}

function StandardDiscoveryCard({ item, onPlan, navigate }: { item: NearbyDiscoveryItem; onPlan: () => void; navigate: (path: string) => void }) {
  const detailPath = item.kind === "event" ? `/events/${item.id}` : `/activities/${item.id}`;
  const dateLabel = item.eventDate ? new Date(item.eventDate).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Flexible date";
  const calendarUrl = getCalendarUrl(item);
  const directionsUrl = getDirectionsUrl(item);
  const sourceStatus = item.kind === "event" ? getEventSourceStatus(item) : null;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{item.kind}</span>
            {item.category && <span className="truncate text-[11px] text-muted-foreground">{item.category}</span>}
            {sourceStatus && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceStatus.className}`}>{sourceStatus.label}</span>}
          </div>
          <h3 className="font-semibold text-sm leading-snug text-foreground">{item.title}</h3>
        </div>
        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{dateLabel}{item.distanceMiles != null ? ` · ${formatMilesAway(item.distanceMiles)}` : ""}</p>
      {item.description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>}
      {item.venueName && <p className="mt-2 flex items-start gap-1 text-xs font-medium text-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{item.venueName}{item.venueCity ? ` · ${item.venueCity}` : ""}</p>}
      {item.address && <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item.address}</p>}
      {sourceStatus && !item.externalUrl && <p className="mt-2 text-xs text-amber-800">{sourceStatus.detail}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="h-8 rounded-full gap-1.5" onClick={onPlan}>
          <CalendarPlus className="h-3.5 w-3.5" /> Plan it
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 rounded-full gap-1.5" onClick={() => navigate(detailPath)}>
          Details <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        {calendarUrl && <a href={calendarUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"><Calendar className="h-3.5 w-3.5" /> Calendar</a>}
        {directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"><Navigation className="h-3.5 w-3.5" /> Directions</a>}
        {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted">Official details <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>Want company? Start with the public event.</span>
        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate(detailPath)}>Meet safely</button>
      </div>
    </div>
  );
}

function NearbyNowModule({ navigate }: { navigate: (path: string) => void }) {
  const { city, detectedCity } = useUserCity();
  const [radiusMiles, setRadiusMiles] = useState(25);
  const hasGps = detectedCity?.lat != null && detectedCity?.lng != null;
  const userLat = hasGps ? Number(detectedCity?.lat) : undefined;
  const userLng = hasGps ? Number(detectedCity?.lng) : undefined;
  const utils = trpc.useUtils();
  const { data: events = [], isLoading: eventsLoading } = trpc.events.list.useQuery({
    city: hasGps ? undefined : city,
    lat: userLat,
    lng: userLng,
    radiusMiles: hasGps ? radiusMiles : undefined,
    limit: 12,
  });
  const { data: activities = [], isLoading: activitiesLoading } = trpc.activityBoard.getAll.useQuery({
    city,
    lat: userLat,
    lng: userLng,
    radiusMiles,
  });
  const officialEvents = events.filter((event: any) => Boolean(event.externalUrl));
  const locallyOwnedDining = activities.filter((activity: any) =>
    (activity.category === "dining" || activity.category === "coffee") &&
    activity.venueIsLocallyOwned &&
    activity.venueName &&
    activity.venueWebsite
  ).slice(0, 2);
  const { data: plan } = trpc.homepage.getTodaysPlan.useQuery();
  const savePlan = trpc.homepage.saveTodaysPlan.useMutation({ onSuccess: () => utils.homepage.getTodaysPlan.invalidate() });
  const clearPlan = trpc.homepage.clearTodaysPlan.useMutation({ onSuccess: () => utils.homepage.getTodaysPlan.invalidate() });
  const { data: myMatches = [] } = trpc.matchmaking.getMyMatches.useQuery();

  const items: NearbyDiscoveryItem[] = [
    ...officialEvents.map((event: any) => ({
      id: Number(event.id), kind: "event" as const, title: event.title, category: event.category,
      description: event.description,
      eventDate: event.eventDate, endDate: event.endDate, venueName: event.venueName, venueCity: event.city ?? event.venueCity,
      address: event.address, externalUrl: event.externalUrl, lat: event.lat, lng: event.lng, distanceMiles: hasGps && event.lat != null && event.lng != null ? haversineDistanceMiles(userLat!, userLng!, Number(event.lat), Number(event.lng)) : event.distanceMiles, source: event.source,
    })),
    ...activities.map((activity: any) => ({
      id: Number(activity.id), kind: "activity" as const, title: activity.title, category: activity.category,
      description: activity.description,
      eventDate: activity.eventDate, endDate: activity.endDate, venueName: activity.venueName, venueCity: activity.venueCity ?? activity.city,
      address: activity.venueAddress ?? activity.address, externalUrl: activity.venueWebsite ?? activity.externalUrl, lat: activity.venueLat ?? activity.lat, lng: activity.venueLng ?? activity.lng, distanceMiles: activity.distanceMiles,
      venueWebsite: activity.venueWebsite, venueIsLocallyOwned: activity.venueIsLocallyOwned, venueOwnershipNote: activity.venueOwnershipNote,
    })),
  ].sort((a, b) => new Date(a.eventDate ?? "9999-12-31").getTime() - new Date(b.eventDate ?? "9999-12-31").getTime()).slice(0, 4);

  const selected = plan ? items.find((item) => (item.kind === "event" && item.id === plan.eventId) || (item.kind === "activity" && item.id === plan.activityId)) : undefined;
  const isLoading = eventsLoading || activitiesLoading;
  const planTitle = selected?.title ?? (plan ? "Your saved plan" : null);

  return (
    <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Navigation className="h-3.5 w-3.5" /> Near you today</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">What’s happening in {city}?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick one thing to do, then use your plan to coordinate safely.</p>
        </div>
        <select aria-label="Nearby discovery radius" value={radiusMiles} onChange={(event) => setRadiusMiles(Number(event.target.value))} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
          <option value={10}>Within 10 miles</option><option value={25}>Within 25 miles</option><option value={50}>Within 50 miles</option>
        </select>
      </div>

      {planTitle && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/5 p-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Today's plan</p><p className="mt-1 font-semibold text-foreground">{planTitle}</p>{selected?.venueName && <p className="text-xs text-muted-foreground">{selected.venueName} · {selected.distanceMiles != null ? formatMilesAway(selected.distanceMiles) : "nearby"}</p>}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => clearPlan.mutate()}>Clear</Button>
            {selected && <Button type="button" size="sm" className="rounded-full" onClick={() => navigate(selected.kind === "event" ? "/events" : `/activities/${selected.id}`)}>Open</Button>}
            {plan?.eventId && selected?.kind === "event" && myMatches.length > 0 && <TodayPlanInviteDialog eventId={plan.eventId} eventTitle={selected.title} eventDate={selected.eventDate} venueName={selected.venueName} matches={myMatches} />}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {isLoading && <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground sm:col-span-2">Finding current events and activities near you…</div>}
        {!isLoading && items.map((item) => <StandardDiscoveryCard key={`${item.kind}-${item.id}`} item={item} navigate={navigate} onPlan={() => savePlan.mutate(buildTodayPlanSelection(item))} />)}
        {!isLoading && items.length === 0 && <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground sm:col-span-2">No verified listings matched this radius. Try 50 miles or search another city.</div>}
      </div>
      {!isLoading && events.length > officialEvents.length && <p className="mt-3 text-xs text-muted-foreground">Community-submitted events remain available in <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate("/events")}>Browse events</button>; the nearby recommendations above prioritize listings with official public handoffs.</p>}
      {locallyOwnedDining.length > 0 && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Community favorites</p>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">Locally owned coffee & dining nearby</h3>
              <p className="mt-1 text-xs text-muted-foreground">Each card shows its exact city. Local ownership is shown only when stated on the business’s official site.</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="rounded-full bg-background" onClick={() => navigate("/activities")}>See all activities</Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {locallyOwnedDining.map((activity: any) => (
              <article key={activity.id} className="rounded-xl border border-orange-100 bg-background p-3">
                <div className="flex items-center gap-2"><span className="text-lg">{activity.category === "coffee" ? "☕" : "🍽️"}</span><Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Locally owned</Badge></div>
                <h4 className="mt-2 font-semibold text-foreground">{activity.venueName}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activity.venueOwnershipNote}</p>
                <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{activity.venueAddress}{activity.venueCity ? ` · ${activity.venueCity}` : ""}</p>
                <a href={activity.venueWebsite} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Official site, hours & menu <ExternalLink className="h-3.5 w-3.5" /></a>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/events")}>Browse events</Button><Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/activities")}>Browse activities</Button></div>
    </section>
  );
}

function renderModule(moduleId: string, navigate: (p: string) => void, profile: any, matches: any[]) {
  switch (moduleId) {
    case "sally":       return <SallyModule profile={profile} navigate={navigate} />;
    case "matches":     return <MatchesModule matches={matches} navigate={navigate} />;
    case "activities":  return <ActivitiesModule navigate={navigate} />;
    case "sports":      return <SportsModule navigate={navigate} />;
    case "games":       return <GamesModule navigate={navigate} />;
    case "community":   return <CommunityModule navigate={navigate} />;
    case "concierge":   return <ConciergeModule navigate={navigate} />;
    case "marketplace": return <MarketplaceModule navigate={navigate} />;
    case "family":      return <FamilyModule navigate={navigate} />;
    case "trip":        return <TripModule navigate={navigate} />;
    case "gymbuddy":    return <GymBuddyModule navigate={navigate} />;
    case "shoutout":    return <ShoutoutModule navigate={navigate} />;
    case "localevents": return <LocalEventsModule navigate={navigate} />;
    default:            return null;
  }
}

// ─── Customize drawer ─────────────────────────────────────────────────────────

function CustomizeDrawer({
  layout,
  onSave,
  onClose,
}: {
  layout: ActiveModule[];
  onSave: (layout: ActiveModule[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ActiveModule[]>([...layout]);
  const dragIndex = useRef<number | null>(null);

  const toggleSection = (moduleId: string) => {
    const next = toggleHomepageSection(draft, moduleId);
    setDraft(next);
    onSave(next);
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = dragIndex.current;
    dragIndex.current = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const reordered = [...draft];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const next = reordered.map((section, position) => ({ ...section, position }));
    setDraft(next);
    onSave(next);
  };

  const handleReset = () => {
    const defaults = ALL_MODULES.map(m => ({
      moduleId: m.id,
      position: m.defaultPosition,
      pinned: m.defaultPinned,
    }));
    setDraft(defaults);
    onSave(defaults);
  };

  const pinnedCount = draft.filter(m => m.pinned).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Customize Your Home</h2>
            <p className="text-xs text-muted-foreground">{pinnedCount} selected · check to add, drag to reorder</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active modules */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {draft.map((m) => {
            const def = ALL_MODULES.find(d => d.id === m.moduleId);
            if (!def) return null;
            return (
              <div
                key={m.moduleId}
                draggable={m.pinned}
                onDragStart={() => handleDragStart(draft.indexOf(m))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(draft.indexOf(m))}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  m.pinned ? "bg-card border-primary/30 shadow-sm" : "bg-muted/40 border-dashed border-border/60"
                }`}
              >
                {m.pinned && <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />}
                <span className="text-xl">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${!m.pinned ? "text-muted-foreground" : ""}`}>{def.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{def.description}</p>
                </div>
                <Checkbox
                  checked={m.pinned}
                  onCheckedChange={() => toggleSection(m.moduleId)}
                  aria-label={`${m.pinned ? "Remove" : "Add"} ${def.label} from your home page`}
                  className="h-5 w-5 flex-shrink-0"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border space-y-2">
          <p className="text-center text-xs text-muted-foreground">Your order is saved automatically.</p>
          <Button className="w-full" onClick={onClose}>Done</Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Authenticated home ───────────────────────────────────────────────────────

function AuthenticatedHome({ user, profile }: { user: any; profile: any }) {
  const [, navigate] = useLocation();
  const [showCustomize, setShowCustomize] = useState(false);
  const [layout, setLayout] = useState<ActiveModule[]>([]);

  const { data: myMatches } = trpc.matchmaking.getMyMatches.useQuery();
  const { data: savedLayout, isLoading: layoutLoading } = trpc.homepage.getLayout.useQuery();
  const saveLayoutMutation = trpc.homepage.saveLayout.useMutation();

  // Build layout from saved DB rows (or defaults)
  useEffect(() => {
    if (!layoutLoading) {
      const saved = savedLayout?.modules ?? [];
      setLayout(buildLayout(saved as ActiveModule[]));
    }
  }, [savedLayout, layoutLoading]);

  const handleSaveLayout = useCallback(async (newLayout: ActiveModule[]) => {
    setLayout(newLayout);
    try {
      await saveLayoutMutation.mutateAsync({ modules: newLayout });
      toast.success("Home layout saved!");
    } catch {
      toast.error("Failed to save layout");
    }
  }, [saveLayoutMutation]);

  const pinnedModules = layout.filter(m => m.pinned).sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8">
        <section className="mb-5 rounded-2xl border border-border/70 bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:p-4" aria-label="Search your community">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <MapPin className="h-3.5 w-3.5" /> Find your community
          </div>
          <LocationOverrideControl compact />
        </section>

        {/* Welcome header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Welcome back, {profile?.displayName || user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              {profile?.interviewCount === 0
                ? "Sally is ready to get to know you better!"
                : `You've had ${profile?.interviewCount} chat${profile?.interviewCount !== 1 ? "s" : ""} with Sally`}
            </p>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate("/shout-out")}
              className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
              aria-label="Recommend Just Putzit to a friend"
              title="Recommend a friend"
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Customize your home"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Customize</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <NearbyNowModule navigate={navigate} />
        </div>

        <div className="mb-6">
          <WaukeshaLibrarySpotlight onExplore={() => navigate("/entertainment")} />
        </div>

        {/* Identity completion prompt */}
        {(!((profile as any)?.gender) || !((profile as any)?.sexualOrientation) || !((profile as any)?.birthDate)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your identity info</p>
              <p className="text-xs text-amber-600">Add your gender, orientation, and age to get better matches</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full border-amber-300 text-amber-700 text-xs" onClick={() => navigate("/profile")}>
              Add info
            </Button>
          </div>
        )}

        {/* Local venue banner */}
        <LocalVenueBanner page="home" className="mb-6" />

        {/* Pinned modules */}
        {layoutLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/40 rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedModules.map(m => {
              const content = renderModule(m.moduleId, navigate, profile, myMatches ?? []);
              if (!content) return null;
              return (
                <div key={m.moduleId} className="relative group">
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!layoutLoading && pinnedModules.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📌</p>
            <p className="font-semibold text-lg">No modules pinned</p>
            <p className="text-muted-foreground text-sm mb-4">Customize your home to pin the sections you use most</p>
            <Button onClick={() => setShowCustomize(true)} className="gap-2">
              <Settings2 className="w-4 h-4" /> Customize Home
            </Button>
          </div>
        )}
      </div>

      {/* Customize drawer */}
      {showCustomize && (
        <CustomizeDrawer
          layout={layout}
          onSave={handleSaveLayout}
          onClose={() => setShowCustomize(false)}
        />
      )}
      <button
        type="button"
        onClick={() => navigate("/shout-out")}
        className="fixed bottom-6 left-2 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-orange-300 bg-orange-500 text-white shadow-lg shadow-orange-500/25 transition-transform hover:bg-orange-600 active:scale-95 sm:flex"
        aria-label="Invite friends to Just Putzit"
        title="Invite friends"
      >
        <Megaphone className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Home() {
  useSEO({
    title: "Just Putzit — Meet Somewhere Real.",
    description: "A free local connection app: match for dates, friends, or activity partners, then choose a safe public plan at an independent local spot or official event.",
    canonical: "https://justputzit.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Just Putzit",
      "operatingSystem": "Web, iOS, Android",
      "applicationCategory": "SocialNetworkingApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Match for dates, friends, or activity partners, then choose a safe public plan at an independent local spot or official event.",
      "url": "https://justputzit.com",
    },
  });
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: verifyStatus } = trpc.verification.getStatus.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && isAuthenticated && profile !== undefined) {
      if (!profile?.onboardingComplete) {
        navigate("/onboarding");
      } else if (!verifyStatus?.locationVerified && verifyStatus !== undefined) {
        navigate("/verify");
      } else if ((profile?.interviewCount ?? 0) === 0) {
        navigate("/interview");
      }
    }
  }, [loading, isAuthenticated, profile, verifyStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">👵</span>
          </div>
          <p className="text-muted-foreground">Loading Just Putzit...</p>
        </div>
      </div>
    );
  }

  // A member may have an authenticated navigation session before their profile
  // query resolves. Do not briefly show public sign-in or onboarding CTAs in
  // that state; wait for the profile decision instead.
  if (isAuthenticated && profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">👵</span>
          </div>
          <p className="text-muted-foreground">Preparing your home…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && profile?.onboardingComplete) {
    return <AuthenticatedHome user={user} profile={profile} />;
  }
  return <LandingPage isAuthenticated={isAuthenticated} />;
}

// ─── Landing page (public) ────────────────────────────────────────────────────

function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [, navigate] = useLocation();
  const primaryAction = isAuthenticated
    ? { label: "Continue setup", destination: "/onboarding" }
    : { label: "Join free", destination: "/signup" };
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-teal-50">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="container relative flex items-center justify-between py-5">
          <img src="/brand/justputzit-logo-transparent_2e545ffa.png" alt="Just Putzit" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated && <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button>}
            <Button size="sm" className="rounded-full gradient-primary text-white" onClick={() => navigate(primaryAction.destination)}>{primaryAction.label}</Button>
          </div>
        </div>

        <div className="container relative grid gap-12 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-20">
          <div className="max-w-2xl">
            <Badge className="mb-5 rounded-full border border-orange-200 bg-white/80 px-4 py-1.5 text-orange-800 shadow-sm">Free local connection for dates, friends &amp; Gym Buddy</Badge>
            <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">Don’t text forever.<br /><span className="text-primary">Meet somewhere real.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Just Putzit is the alternative to swipe-only apps and conversations that go nowhere. Sally helps you connect for dates, friends, activities, and workouts—then makes a real public plan at an independent local place or official event.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full gradient-primary text-white btn-scale" onClick={() => navigate(primaryAction.destination)}><Heart className="mr-2 h-5 w-5" />{isAuthenticated ? "Continue your setup" : "Join free"}</Button>
              <Button size="lg" variant="outline" className="rounded-full bg-white/70" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>See how it works</Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-rose-500" />Dates, friends &amp; activity partners</span><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-teal-700" />Independent places first</span><span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-700" />Visible safety controls</span></div>
          </div>

          <aside className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_rgba(110,77,44,0.18)] backdrop-blur sm:p-6" aria-label="An example of Sally making a public local plan">
            <div className="absolute -right-2 -top-3 rounded-full bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg">A plan, not a pickup line</div>
            <div className="flex items-center gap-3"><AdvisorAvatar size="lg" /><div><p className="font-semibold text-foreground">Sally’s local read</p><p className="text-sm text-muted-foreground">A friendly guide, not a swipe machine</p></div></div>
            <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm leading-relaxed text-foreground"><span className="font-semibold text-primary">Sally:</span> “You both enjoy laid-back music and a good coffee shop. When you’re both ready, choose a public café or an official local event.”</div>
            <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">A safer first plan</p><div className="mt-2 flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" /><p className="text-sm font-medium text-foreground">A public time + local place you both choose</p></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">No address sharing, no pressure to meet, and private accept/decline choices.</p></div>
            <Button size="sm" variant="outline" aria-label="Explore Safety & Trust" className="mt-4 w-full rounded-full border-teal-200 bg-white text-teal-800 hover:bg-teal-50" onClick={() => navigate("/safety")}><Shield className="mr-1.5 h-3.5 w-3.5" />Explore Safety &amp; Trust</Button>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="container"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The core loop</p><h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Match with intent. Then show up somewhere real.</h2><p className="mt-4 text-muted-foreground">Whether you want a date, a new friend, a workout partner, a couples plan, or a family outing, the destination is a practical public plan—not more endless messaging.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{[
          { icon: "👵", title: "Meet Sally", text: "Share your intent, interests, group type, vibe, and first-meet comfort in a warm personal conversation." },
          { icon: "💕", title: "Match with purpose", text: "Connect around shared values and intent for dating, friendship, Gym Buddy, couples plans, or family activities." },
          { icon: "🗺️", title: "Choose a real plan", text: "Sally favors independent cafés, local dining, farmers markets, community gyms, small venues, and official events when documented options exist." },
        ].map((item, index) => <article key={item.title} className="relative rounded-3xl border border-border bg-stone-50/70 p-6"><span className="absolute right-5 top-5 text-xs font-bold text-primary/60">0{index + 1}</span><div className="text-4xl">{item.icon}</div><h3 className="mt-5 text-xl font-bold text-foreground">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></article>)}</div></div>
      </section>

      <section className="border-y border-teal-100 bg-teal-50/55 py-20"><div className="container"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Why it feels different</p><h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Less anonymous swiping. More room to decide.</h2><p className="mt-4 text-muted-foreground">People are tired of fake-feeling profiles and bad experiences. Just Putzit makes practical safeguards and public plans visible early while leaving every member in control.</p></div><div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3"><article className="rounded-3xl bg-white p-6 shadow-sm"><Heart className="h-6 w-6 text-rose-600" /><h3 className="mt-4 font-semibold text-foreground">Connection before convenience</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Intentional matching gives dates, friendships, and activity partnerships a clearer starting point than an endless swipe feed.</p></article><article className="rounded-3xl bg-white p-6 shadow-sm"><MapPin className="h-6 w-6 text-teal-700" /><h3 className="mt-4 font-semibold text-foreground">A place is part of the match</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">When official or owner-supported records exist, local independents and public events take priority over franchise-first ideas.</p></article><article className="rounded-3xl bg-white p-6 shadow-sm"><Shield className="h-6 w-6 text-blue-700" /><h3 className="mt-4 font-semibold text-foreground">Safety tools are visible</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Private report and block controls, optional account signals, and public-first plan guidance support your judgment. They do not replace it.</p></article></div></div></section>

      <section className="bg-white py-20"><div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Featured pathway</p><h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Gym Buddy is built to get people moving together.</h2><p className="mt-4 max-w-xl text-muted-foreground">Choose a local gym, find a compatible workout partner, plan a public session, and keep each other accountable. Community and independent gyms can request a partnership without exposing member identity or location data; proposed changes are reviewed by an administrator before publication.</p><div className="mt-6 flex flex-wrap gap-3"><Button className="rounded-full bg-orange-600 text-white hover:bg-orange-700" onClick={() => navigate("/gym-buddy")}>Explore Gym Buddy</Button><Button variant="outline" className="rounded-full" onClick={() => navigate("/vendor")}>Partner as a local gym</Button></div></div><div className="rounded-[2rem] bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-7 text-white shadow-xl"><div className="text-5xl">🏋️</div><p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-orange-100">Gym Buddy</p><h3 className="mt-2 font-display text-3xl font-bold">Pick a gym. Set your style. Show up.</h3><p className="mt-4 text-sm leading-relaxed text-white/85">For accountability, workouts, and friendship—not another empty chat thread.</p><div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-semibold"><span className="rounded-xl bg-white/15 px-2 py-3">Local gyms</span><span className="rounded-xl bg-white/15 px-2 py-3">Workout match</span><span className="rounded-xl bg-white/15 px-2 py-3">Public sessions</span></div></div></div></section>

      <section className="gradient-warm py-20 text-center"><div className="container"><h2 className="font-display text-3xl font-bold text-foreground">Ready to meet somewhere real?</h2><p className="mx-auto mt-4 max-w-xl text-muted-foreground">Join free. Start with Sally, make connections with intention, and choose a local plan on your terms.</p><Button size="lg" className="mt-8 rounded-full gradient-primary text-white btn-scale" onClick={() => navigate(primaryAction.destination)}><Heart className="mr-2 h-5 w-5" />{isAuthenticated ? "Continue your setup" : "Join free today"}</Button></div></section>

      <footer className="border-t border-border bg-muted/30 py-8"><div className="container flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>&copy; 2026 Just Putzit. All rights reserved.</p><div className="flex gap-6"><a href="/privacy" className="hover:text-foreground">Privacy Policy</a><a href="/safety" className="hover:text-foreground">Safety &amp; Trust</a></div></div></footer>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function MatchCard({ match, onChat }: any) {
  const profile = match.otherProfile;
  const traits = profile?.traits as any;
  return (
    <div className="border border-border rounded-2xl p-4 card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: profile?.avatarColor || "#f97316" }}
        >
          {profile?.avatarEmoji || "😊"}
        </div>
        <div>
          <p className="font-bold text-sm">{profile?.displayName || "Mystery Match"}</p>
          <p className="text-xs text-primary font-semibold">{match.compatibilityScore}% compatible</p>
        </div>
      </div>
      {traits?.personalityKeywords && (
        <div className="flex flex-wrap gap-1 mb-3">
          {traits.personalityKeywords.slice(0, 3).map((k: string) => (
            <Badge key={k} variant="secondary" className="text-xs rounded-full">{k}</Badge>
          ))}
        </div>
      )}
      <Button size="sm" variant="outline" className="w-full rounded-full gap-2" onClick={onChat}>
        <MessageCircle className="w-3 h-3" /> Chat
      </Button>
    </div>
  );
}
