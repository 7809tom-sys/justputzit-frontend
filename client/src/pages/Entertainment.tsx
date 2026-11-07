import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useUserCity } from "@/hooks/useUserCity";
import { useSEO } from "@/hooks/useSEO";
import {
  calendarsForCity,
  calendarsNearCity,
  filterCurrentEntertainment,
  filterVenueListings,
  matchesEntertainmentKind,
  type EntertainmentCalendar,
  type EntertainmentKind,
  type EntertainmentListing,
} from "@/lib/entertainmentDiscovery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Compass, ExternalLink, Film, MapPin, Music, Theater, Ticket } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

const entertainmentKinds = [
  { id: "all", label: "All entertainment" },
  { id: "live_music", label: "Live bands" },
  { id: "comedy", label: "Comedy" },
  { id: "karaoke", label: "Karaoke" },
  { id: "theatre", label: "Theatre" },
  { id: "film", label: "Film" },
  { id: "festival", label: "Festivals" },
  { id: "family", label: "Family shows" },
] as const satisfies ReadonlyArray<{ id: EntertainmentKind; label: string }>;

const kindEmoji: Record<EntertainmentKind, string> = {
  all: "🎟️",
  live_music: "🎸",
  comedy: "🎤",
  karaoke: "🎙️",
  theatre: "🎭",
  film: "🎬",
  festival: "🎪",
  family: "🧸",
};

export default function Entertainment() {
  const { city } = useUserCity();
  const { data: listings, isLoading } = trpc.events.list.useQuery({ city, limit: 100 });
  const { data: waukeshaListings, isLoading: isLoadingWaukeshaLibrary } = trpc.events.list.useQuery({ city: "Waukesha", limit: 100 });
  const trackClick = trpc.entertainment.trackEntertainmentClick.useMutation();
  const [kind, setKind] = useState<EntertainmentKind>("all");
  const currentEntertainment = useMemo(() => filterCurrentEntertainment((listings ?? []) as EntertainmentListing[]), [listings]);
  const filteredEntertainment = useMemo(() => currentEntertainment.filter((event) => matchesEntertainmentKind(event, kind)), [currentEntertainment, kind]);
  const waukeshaLibraryPrograms = useMemo(() => filterVenueListings((waukeshaListings ?? []) as EntertainmentListing[], "Waukesha Public Library"), [waukeshaListings]);
  const localCalendars = useMemo(() => calendarsNearCity(city), [city]);
  const cityCalendars = useMemo(() => calendarsForCity(city, kind), [city, kind]);
  const filteredLocalCalendars = useMemo(() => calendarsNearCity(city, kind), [city, kind]);
  const otherCityCalendars = useMemo(() => cityCalendars.filter((calendar) => calendar.city !== "any" && calendar.city.toLowerCase() !== (city ?? "").trim().toLowerCase()), [cityCalendars, city]);
  const anywhereCalendars = useMemo(() => cityCalendars.filter((calendar) => calendar.city === "any"), [cityCalendars]);

  useSEO({
    title: `Entertainment and Things to Do in ${city}`,
    description: `Live music, comedy, theatre, film, and festivals near ${city}. Every Just Putzit listing links to its official source for final times, tickets, and accessibility details.`,
    canonical: "https://justputzit.com/entertainment",
  });

  const openOfficialListing = (listing: EntertainmentListing) => {
    if (!listing.externalUrl) return;
    trackClick.mutate({ category: "other", eventId: String(listing.id), eventTitle: listing.title, venueName: listing.venueName ?? undefined, venueCity: listing.city, affiliateNetwork: "official_source", affiliateUrl: listing.externalUrl, estimatedCommissionPct: 0 });
    window.open(listing.externalUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening the official event page");
  };

  const openCalendar = (calendar: EntertainmentCalendar) => {
    window.open(calendar.href, "_blank", "noopener,noreferrer");
    toast.success(`Opening ${calendar.title}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-7 sm:py-9">
        <div className="mb-7 rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50 to-background p-5 sm:p-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600"><Music className="h-4 w-4" /> Local entertainment, kept current</div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">What’s on near {city}?</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Live music, theatre, film, festivals, comedy, and community performances from Just Putzit’s current local event feed. Every card links back to its official source.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full bg-orange-500 text-white hover:bg-orange-600"><Link href="/things-to-do"><Compass className="mr-1.5 h-4 w-4" /> Browse things to do</Link></Button>
            {localCalendars.length > 0 && <Badge variant="secondary" className="rounded-full px-3 py-1.5">{localCalendars.length} official {localCalendars.length === 1 ? "source" : "sources"} in {city}</Badge>}          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" aria-label="Entertainment type filters">
          {entertainmentKinds.map((item) => (
            <Button key={item.id} type="button" size="sm" variant={kind === item.id ? "default" : "outline"} className="rounded-full" onClick={() => setKind(item.id)}>
              <span aria-hidden="true" className="mr-1">{kindEmoji[item.id]}</span>{item.label}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="current">
          <TabsList className="mb-6 h-auto flex-wrap gap-1 rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value="current" className="gap-1.5 rounded-xl"><CalendarDays className="h-3.5 w-3.5" /> Current near you</TabsTrigger>
            <TabsTrigger value="calendars" className="gap-1.5 rounded-xl"><Theater className="h-3.5 w-3.5" /> Official calendars</TabsTrigger>
            <TabsTrigger value="movies" className="gap-1.5 rounded-xl"><Film className="h-3.5 w-3.5" /> Movies & showtimes</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div><p className="font-semibold">Upcoming {kind === "all" ? "entertainment" : entertainmentKinds.find((item) => item.id === kind)?.label.toLowerCase()} in {city}</p><p className="text-sm text-muted-foreground">Use the official source for final time, ticket, and accessibility details.</p></div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">Live local feed</Badge>
            </div>
            {isLoading ? <div className="space-y-3">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-32 rounded-2xl" />)}</div> : filteredEntertainment.length ? <div className="grid gap-4 md:grid-cols-2">{filteredEntertainment.map((event) => <CurrentEventCard key={event.id} event={event} onOpen={openOfficialListing} />)}</div> : <div className="rounded-2xl border border-dashed border-border p-8 text-center"><Music className="mx-auto mb-3 h-7 w-7 text-orange-500" /><h2 className="font-display text-xl font-bold">More {kind === "all" ? "entertainment" : entertainmentKinds.find((item) => item.id === kind)?.label.toLowerCase()} is being refreshed for {city}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Browse trusted official calendars below, or start from a plan in Things to Do.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Button asChild className="rounded-full"><Link href="/things-to-do">Browse things to do</Link></Button><Button asChild variant="outline" className="rounded-full"><Link href="/events">All local events</Link></Button></div></div>}
            <section aria-labelledby="waukesha-library-programs" className="rounded-3xl border border-sky-100 bg-sky-50/60 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Featured Waukesha venue</p><h2 id="waukesha-library-programs" className="font-display text-2xl font-bold">Waukesha Public Library programs</h2><p className="mt-1 text-sm text-muted-foreground">Free, current library events—shown here even when you are browsing another nearby city.</p></div><Button variant="outline" className="rounded-full border-sky-200 bg-white" onClick={() => window.open("https://waukesha.librarycalendar.com/events/upcoming", "_blank", "noopener,noreferrer")}>Library calendar <ExternalLink className="ml-1.5 h-4 w-4" /></Button></div>
              {isLoadingWaukeshaLibrary ? <div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div> : waukeshaLibraryPrograms.length ? <div className="grid gap-3 md:grid-cols-2">{waukeshaLibraryPrograms.map((event) => <CurrentEventCard key={event.id} event={event} onOpen={openOfficialListing} compact />)}</div> : <p className="rounded-2xl bg-white/80 p-4 text-sm text-muted-foreground">The official library calendar is available above while its current programs load.</p>}
            </section>
          </TabsContent>

          <TabsContent value="calendars" className="space-y-6">
            {filteredLocalCalendars.length > 0 && (
              <section aria-labelledby="entertainment-near-you">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Official sources near you</p>
                    <h2 id="entertainment-near-you" className="font-display text-2xl font-bold">{city} venues and calendars</h2>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">{filteredLocalCalendars.length} {filteredLocalCalendars.length === 1 ? "source" : "sources"}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{filteredLocalCalendars.map((calendar) => <CalendarCard key={`${calendar.city}-${calendar.title}`} calendar={calendar} onOpen={openCalendar} emphasize />)}</div>
              </section>
            )}
            {otherCityCalendars.length > 0 && (
              <section aria-labelledby="entertainment-more-sources">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{filteredLocalCalendars.length > 0 ? "More official calendars" : "Official calendars"}</p>
                  <h2 id="entertainment-more-sources" className="font-display text-2xl font-bold">Where to confirm times, tickets, and accessibility</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Just Putzit never republishes a venue’s schedule as final. Each source below is the venue or organizer’s own page for {kind === "all" ? "every kind of show" : entertainmentKinds.find((item) => item.id === kind)?.label.toLowerCase()}.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{otherCityCalendars.map((calendar) => <CalendarCard key={`${calendar.city}-${calendar.title}`} calendar={calendar} onOpen={openCalendar} />)}</div>
              </section>
            )}
            {filteredLocalCalendars.length === 0 && otherCityCalendars.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No official {kind === "all" ? "entertainment" : entertainmentKinds.find((item) => item.id === kind)?.label.toLowerCase()} sources are listed yet. Try another type or the directories below.</p>
            )}
            {anywhereCalendars.length > 0 && (
              <section aria-labelledby="entertainment-directories" className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-5">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Works from any city</p>
                  <h2 id="entertainment-directories" className="font-display text-xl font-bold">Directories and ticket searches</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">{anywhereCalendars.map((calendar) => (
                  <button key={calendar.title} type="button" onClick={() => openCalendar(calendar)} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-orange-300">
                    <div>
                      <p className="font-semibold">{calendar.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{calendar.detail}</p>
                    </div>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                  </button>
                ))}</div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="movies"><Card className="border-border/80 shadow-sm"><CardContent className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><Film className="h-7 w-7" /></div><div><h2 className="font-display text-2xl font-bold">Current movie showtimes</h2><p className="mt-1 text-sm text-muted-foreground">Showtimes change throughout the day, so Just Putzit sends you to the theatre’s live schedule instead of showing stale film listings.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open("https://www.marcustheatres.com/theatre-locations/majestic-cinema-of-brookfield", "_blank", "noopener,noreferrer")}>Majestic Cinema</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open("https://www.fandango.com/milwaukee_wi_movietimes", "_blank", "noopener,noreferrer")}>All nearby cinemas</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open("https://www.milwaukeefilm.org/", "_blank", "noopener,noreferrer")}>Milwaukee Film</Button></div></div><Button className="rounded-full bg-orange-500 text-white hover:bg-orange-600" onClick={() => window.open("https://www.marcustheatres.com/theatre-locations/majestic-cinema-of-brookfield", "_blank", "noopener,noreferrer")}><Ticket className="mr-1.5 h-4 w-4" /> See showtimes</Button></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CalendarCard({ calendar, onOpen, emphasize = false }: { calendar: EntertainmentCalendar; onOpen: (calendar: EntertainmentCalendar) => void; emphasize?: boolean }) {
  return (
    <Card className={emphasize ? "border-orange-200 bg-orange-50/40 shadow-sm" : "border-border/80 shadow-sm"}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Theater className={emphasize ? "h-6 w-6 text-orange-600" : "h-6 w-6 text-orange-500"} />
          {calendar.city !== "any" && <Badge variant="secondary" className="rounded-full">{calendar.city}</Badge>}
        </div>
        <h2 className="font-display text-xl font-bold">{calendar.title}</h2>
        <p className="mt-2 min-h-12 text-sm text-muted-foreground">{calendar.detail}</p>
        <Button className="mt-5 rounded-full" variant="outline" onClick={() => onOpen(calendar)}>{calendar.label}<ExternalLink className="ml-1.5 h-4 w-4" /></Button>
      </CardContent>
    </Card>
  );
}

function CurrentEventCard({ event, onOpen, compact = false }: { event: EntertainmentListing; onOpen: (event: EntertainmentListing) => void; compact?: boolean }) {
  return <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"><CardContent className={compact ? "p-4" : "p-5"}><div className="mb-3 flex items-start justify-between gap-3"><Badge variant="secondary" className="capitalize">{event.category}</Badge><span className="text-xs font-medium text-orange-600">{event.isFree ? "Free" : "Tickets / details"}</span></div><h2 className={compact ? "font-display text-lg font-bold leading-tight" : "font-display text-xl font-bold leading-tight"}>{event.title}</h2><div className="mt-3 space-y-1.5 text-sm text-muted-foreground"><p className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />{formatEventDate(event.eventDate)}</p><p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />{event.venueName ?? "Local venue"} · {event.city}</p></div><div className="mt-5 flex gap-2"><Button asChild variant="outline" className="rounded-full"><Link href="/events">See in Events</Link></Button>{event.externalUrl && <Button onClick={() => onOpen(event)} className="rounded-full bg-orange-500 text-white hover:bg-orange-600"><ExternalLink className="mr-1.5 h-4 w-4" /> Official details</Button>}</div></CardContent></Card>;
}
