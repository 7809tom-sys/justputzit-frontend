import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useUserCity } from "@/hooks/useUserCity";
import { useSEO } from "@/hooks/useSEO";
import {
  ACTIVITY_IDEA_BUDGETS,
  ACTIVITY_IDEA_CATEGORIES,
  ACTIVITY_IDEA_GROUPS,
  ACTIVITY_IDEA_TIMES,
  ACTIVITY_IDEAS,
  filterActivityIdeas,
  groupActivityIdeasByCategory,
  pickSeasonalIdeas,
  sortIdeasForSeason,
  type ActivityIdea,
  type ActivityIdeaBudget,
  type ActivityIdeaCategory,
  type ActivityIdeaGroup,
  type ActivityIdeaTime,
} from "@shared/activityIdeas";
import {
  directionsUrl,
  searchNearbyKeywords,
  type NearbyPlace,
} from "@/lib/maptiler";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Compass,
  ExternalLink,
  Heart,
  Lightbulb,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type VenueState = {
  status: "idle" | "loading" | "ready" | "error";
  places: NearbyPlace[];
  message?: string;
};

const budgetLabels = new Map(
  ACTIVITY_IDEA_BUDGETS.map(budget => [budget.id, budget.label])
);
const categoryLabels = new Map(
  ACTIVITY_IDEA_CATEGORIES.map(category => [category.id, category.label])
);
const groupLabels = new Map(
  ACTIVITY_IDEA_GROUPS.map(group => [group.id, group.label])
);

/** A plain map search that works with no API key, so a member always has a next step. */
function mapsSearchUrl(idea: ActivityIdea, city: string) {
  const query = `${idea.searchKeywords[0]} near ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function ThingsToDo() {
  const { city, detectedCity } = useUserCity();
  const center = useMemo(
    () =>
      detectedCity?.lat !== undefined && detectedCity?.lng !== undefined
        ? { lat: detectedCity.lat, lng: detectedCity.lng }
        : null,
    [detectedCity?.lat, detectedCity?.lng]
  );
  const [category, setCategory] = useState<ActivityIdeaCategory | "all">("all");
  const [group, setGroup] = useState<ActivityIdeaGroup | "all">("all");
  const [budget, setBudget] = useState<ActivityIdeaBudget | "all">("all");
  const [timeOfDay, setTimeOfDay] = useState<ActivityIdeaTime | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [venues, setVenues] = useState<Record<string, VenueState>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  const seasonalIdeas = useMemo(() => pickSeasonalIdeas(new Date(), 4), []);
  const filteredIdeas = useMemo(
    () =>
      sortIdeasForSeason(
        filterActivityIdeas(ACTIVITY_IDEAS, {
          category,
          group,
          budget,
          timeOfDay,
          query: searchQuery,
        })
      ),
    [category, group, budget, timeOfDay, searchQuery]
  );
  const groupedIdeas = useMemo(
    () => groupActivityIdeasByCategory(filteredIdeas),
    [filteredIdeas]
  );
  const { data: nearbyEvents = [], isLoading: isLoadingEvents } =
    trpc.events.list.useQuery(
      { city, lat: center?.lat, lng: center?.lng, radiusMiles: 25, limit: 24 },
      { staleTime: 60_000 }
    );

  useSEO({
    title: `Things to Do in ${city}`,
    description: `Real things to do near ${city}: date ideas, group outings, free and cheap plans, and official local calendars. Filter by mood, budget, and time of day, then find a venue nearby.`,
    canonical: "https://justputzit.com/things-to-do",
  });

  const loadVenuesForIdea = useCallback(
    async (idea: ActivityIdea) => {
      if (!center) return;
      setVenues(current => ({
        ...current,
        [idea.id]: {
          status: "loading",
          places: current[idea.id]?.places ?? [],
        },
      }));
      try {
        const places = await searchNearbyKeywords(center, idea.searchKeywords, {
          radiusMeters: 24_000,
          perKeyword: 6,
          max: 3,
        });
        setVenues(current => ({
          ...current,
          [idea.id]: { status: "ready", places },
        }));
      } catch (error) {
        setVenues(current => ({
          ...current,
          [idea.id]: {
            status: "error",
            places: [],
            message:
              error instanceof Error
                ? error.message
                : "Couldn’t find venues nearby.",
          },
        }));
      }
    },
    [center]
  );

  const openIdea = (idea: ActivityIdea) => {
    setSelectedIdeaId(idea.id);
    if (center && venues[idea.id]?.status !== "ready")
      void loadVenuesForIdea(idea);
  };

  const findVenuesForVisibleIdeas = async () => {
    if (!center) {
      toast.error("Set your location first so we can search nearby venues.");
      return;
    }
    const targets = groupedIdeas
      .flatMap(section => section.ideas)
      .slice(0, 9)
      .filter(idea => venues[idea.id]?.status !== "ready");
    if (targets.length === 0) {
      toast.success("Nearby venues are already loaded.");
      return;
    }
    setBulkLoading(true);
    try {
      for (const idea of targets) await loadVenuesForIdea(idea);
      toast.success(
        `Found venues for ${targets.length} ${targets.length === 1 ? "idea" : "ideas"} near ${city}.`
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const clearFilters = () => {
    setCategory("all");
    setGroup("all");
    setBudget("all");
    setTimeOfDay("all");
    setSearchQuery("");
  };

  const activeFilterCount = [
    category !== "all",
    group !== "all",
    budget !== "all",
    timeOfDay !== "all",
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-7 sm:py-9">
        <header className="mb-7 overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-emerald-50 to-background p-5 sm:p-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Compass className="h-4 w-4" /> Things to do near {city}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Stop putzing around.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {ACTIVITY_IDEAS.length} concrete plans — free walks, bowling nights,
            trivia, live music, classes, and seasonal outings — each paired with
            real venues near you. Pick one, then confirm details with the venue.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full bg-teal-700 text-white hover:bg-teal-800"
              onClick={() => void findVenuesForVisibleIdeas()}
              disabled={bulkLoading || !center}
            >
              {bulkLoading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="mr-1.5 h-4 w-4" />
              )}
              {bulkLoading ? "Finding venues…" : "Find venues nearby"}
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full bg-white"
            >
              <Link href="/entertainment">
                <Ticket className="mr-1.5 h-4 w-4" /> Concerts & showtimes
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full bg-white"
            >
              <Link href="/activity-board">
                <CalendarDays className="mr-1.5 h-4 w-4" /> This week’s events
              </Link>
            </Button>
          </div>
          <div className="mt-4 max-w-xl">
            <LocationOverrideControl compact />
          </div>
          {!center && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Venue search needs your location. Search a city or ZIP above to
              unlock nearby suggestions.
            </p>
          )}
        </header>

        <section
          aria-labelledby="seasonal-picks"
          className="mb-8 rounded-3xl border border-orange-100 bg-orange-50/50 p-4 sm:p-5"
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                Right now
              </p>
              <h2
                id="seasonal-picks"
                className="font-display text-xl font-bold"
              >
                Good for this time of year
              </h2>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {seasonalIdeas.length} picks
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {seasonalIdeas.map(idea => (
              <button
                key={idea.id}
                type="button"
                onClick={() => {
                  openIdea(idea);
                  document
                    .getElementById("idea-catalog")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-2xl border border-orange-100 bg-white p-4 text-left transition-shadow hover:shadow-md"
              >
                <span className="text-2xl" aria-hidden="true">
                  {idea.emoji}
                </span>
                <p className="mt-2 font-semibold leading-tight">{idea.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoryLabels.get(idea.category)} ·{" "}
                  {budgetLabels.get(idea.budget)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6 space-y-3" aria-label="Things to do filters">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search ideas — bowling, hike, trivia, brunch…"
              aria-label="Search things to do"
              className="h-12 rounded-xl pl-10 text-base"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-1 flex-wrap gap-1.5"
              aria-label="Idea categories"
            >
              <Button
                type="button"
                size="sm"
                variant={category === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategory("all")}
              >
                All ideas
              </Button>
              {ACTIVITY_IDEA_CATEGORIES.map(item => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={category === item.id ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() =>
                    setCategory(category === item.id ? "all" : item.id)
                  }
                >
                  <span aria-hidden="true" className="mr-1">
                    {item.emoji}
                  </span>
                  {item.label}
                </Button>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full text-xs"
                onClick={clearFilters}
              >
                Clear {activeFilterCount}
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-xs font-semibold text-muted-foreground">
              Who’s going
              <select
                value={group}
                onChange={event =>
                  setGroup(event.target.value as ActivityIdeaGroup | "all")
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-2 text-sm font-normal text-foreground"
              >
                <option value="all">Anyone</option>
                {ACTIVITY_IDEA_GROUPS.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Budget
              <select
                value={budget}
                onChange={event =>
                  setBudget(event.target.value as ActivityIdeaBudget | "all")
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-2 text-sm font-normal text-foreground"
              >
                <option value="all">Any budget</option>
                {ACTIVITY_IDEA_BUDGETS.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label} — {item.hint}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Time of day
              <select
                value={timeOfDay}
                onChange={event =>
                  setTimeOfDay(event.target.value as ActivityIdeaTime | "all")
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-2 text-sm font-normal text-foreground"
              >
                <option value="all">Any time</option>
                {ACTIVITY_IDEA_TIMES.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground" role="status">
          Showing {filteredIdeas.length} of {ACTIVITY_IDEAS.length}{" "}
          {ACTIVITY_IDEAS.length === 1 ? "idea" : "ideas"}
          {activeFilterCount > 0 ? " matching your filters" : ` for ${city}`} ·
          in-season plans first
        </p>

        <div id="idea-catalog" className="space-y-8">
          {groupedIdeas.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Lightbulb className="mx-auto mb-3 h-8 w-8 text-teal-600" />
                <h2 className="font-display text-xl font-bold">
                  No ideas match those filters
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Try a wider budget, another time of day, or clear the search
                  to see all {ACTIVITY_IDEAS.length} ideas.
                </p>
                <Button className="mt-4 rounded-full" onClick={clearFilters}>
                  Show every idea
                </Button>
              </CardContent>
            </Card>
          )}
          {groupedIdeas.map(section => (
            <section
              key={section.category.id}
              aria-labelledby={`idea-category-${section.category.id}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2
                  id={`idea-category-${section.category.id}`}
                  className="font-display text-2xl font-bold"
                >
                  <span aria-hidden="true" className="mr-2">
                    {section.category.emoji}
                  </span>
                  {section.category.label}
                </h2>
                <Badge variant="secondary" className="rounded-full">
                  {section.ideas.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.ideas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    venueState={venues[idea.id]}
                    hasLocation={Boolean(center)}
                    city={city}
                    expanded={selectedIdeaId === idea.id}
                    onOpen={() => openIdea(idea)}
                    onFindVenues={() => void loadVenuesForIdea(idea)}
                    onCollapse={() => setSelectedIdeaId(null)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section
          aria-labelledby="things-to-do-events"
          className="mt-10 rounded-3xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                Happening soon
              </p>
              <h2
                id="things-to-do-events"
                className="font-display text-2xl font-bold"
              >
                Dated events near {city}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                When you want something on the calendar rather than an idea,
                start here — every listing links back to its official source.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full"
            >
              <Link href="/activity-board">See all events</Link>
            </Button>
          </div>
          {isLoadingEvents ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map(key => (
                <Skeleton key={key} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : nearbyEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No dated events are listed within 25 miles right now. Use the
              ideas above, or check the official calendars on the entertainment
              page.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(
                nearbyEvents as Array<{
                  id: number | string;
                  title: string;
                  eventDate: Date | string;
                  venueName?: string | null;
                  city: string;
                  isFree: boolean;
                  externalUrl?: string | null;
                }>
              )
                .slice(0, 6)
                .map(event => (
                  <article
                    key={event.id}
                    className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-tight">
                          {event.title}
                        </h3>
                        {event.isFree && (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px]"
                          >
                            Free
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {new Date(event.eventDate).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {[event.venueName ?? "Local venue", event.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs"
                      >
                        <Link href={`/events/${event.id}`}>Details</Link>
                      </Button>
                      {event.externalUrl && (
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full text-xs"
                        >
                          <a
                            href={event.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Official page{" "}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>

        <p className="mt-8 flex items-start gap-2 rounded-2xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          Hours, prices, age rules, and reservations change. Just Putzit
          suggests the plan and finds the venue; the venue’s own page is the
          source of truth before you go.
        </p>
      </div>
    </div>
  );
}

function IdeaCard({
  idea,
  venueState,
  hasLocation,
  city,
  expanded,
  onOpen,
  onFindVenues,
  onCollapse,
}: {
  idea: ActivityIdea;
  venueState?: VenueState;
  hasLocation: boolean;
  city: string;
  expanded: boolean;
  onOpen: () => void;
  onFindVenues: () => void;
  onCollapse: () => void;
}) {
  const places = venueState?.places ?? [];
  const isLoading = venueState?.status === "loading";

  return (
    <Card
      className={`flex flex-col border-border/80 shadow-sm transition-shadow hover:shadow-md ${expanded ? "ring-2 ring-teal-200" : ""}`}
    >
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">
            {idea.emoji}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {budgetLabels.get(idea.budget)}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] capitalize"
            >
              {idea.setting === "either" ? "In or out" : idea.setting}
            </Badge>
          </div>
        </div>
        <h3 className="font-display text-lg font-bold leading-tight">
          {idea.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          {idea.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" aria-hidden="true" />
          {idea.bestFor.map(who => groupLabels.get(who)).join(" · ")}
        </div>
        {idea.tip && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {idea.tip}
          </p>
        )}

        {expanded && (
          <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">
                Venues nearby
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[11px]"
                onClick={onCollapse}
              >
                Hide
              </Button>
            </div>
            {!hasLocation && (
              <p className="mt-2 text-xs text-teal-900">
                Set your location to search venues near you.
              </p>
            )}
            {hasLocation && isLoading && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-teal-900">
                <Loader2 className="h-3 w-3 animate-spin" /> Looking near you…
              </p>
            )}
            {hasLocation && !isLoading && places.length === 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-teal-900">
                  {venueState?.status === "error"
                    ? "Live venue search is unavailable right now, so here is a direct map search instead."
                    : "No matching venues turned up within 15 miles."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full bg-white text-[11px]"
                  >
                    <a
                      href={mapsSearchUrl(idea, city)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="mr-1 h-3 w-3" /> Search {city} maps
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full text-[11px]"
                    onClick={onFindVenues}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            )}
            {places.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {places.map(place => (
                  <li
                    key={place.id}
                    className="rounded-xl bg-white/80 px-2.5 py-2"
                  >
                    <p className="truncate text-xs font-semibold text-foreground">
                      {place.name}
                    </p>
                    {place.address && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {place.address}
                      </p>
                    )}
                    <a
                      href={directionsUrl(place.lat, place.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                    >
                      <Navigation className="h-3 w-3" /> Directions
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!expanded && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={onOpen}
            >
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Find a place
            </Button>
          )}
          {idea.officialLinks?.map(link => (
            <Button
              key={link.href}
              asChild
              size="sm"
              variant="ghost"
              className="rounded-full text-xs"
            >
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          ))}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="rounded-full text-xs"
          >
            <Link href="/trip-planner">
              <Heart className="mr-1 h-3 w-3" /> Plan it
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
