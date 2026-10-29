import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Church, ExternalLink, HandHeart, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

type DirectoryKind = "churches" | "help";

type CommunityDirectoryPanelProps = {
  city?: string;
  state?: string | null;
  lat?: number;
  lng?: number;
};

const DIRECTORY_TABS: Array<{ id: DirectoryKind; label: string; icon: typeof Church }> = [
  { id: "churches", label: "Every local congregation", icon: Church },
  { id: "help", label: "Community help", icon: HandHeart },
];
const INITIAL_CONGREGATION_COUNT = 40;
const CONGREGATION_INCREMENT = 40;

function MapListingCard({ place, sourceLabel, city, state }: { place: { directoryId: string; source: "OpenStreetMap" | "MapTiler"; name: string; address: string; mapUrl: string; directionsUrl?: string; religion?: string; denomination?: string }; sourceLabel?: string; city?: string; state?: string | null }) {
  const detailLabels = [place.religion, place.denomination].filter(Boolean);
  const claimQuery = new URLSearchParams({ directoryId: place.directoryId, name: place.name, address: place.address, city: city ?? "", state: state ?? "" });
  return <article className="rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5"><p className="font-semibold text-gray-900">{place.name}</p><Badge variant="outline" className="h-5 border-indigo-100 bg-indigo-50 text-[10px] font-medium text-indigo-700">{sourceLabel ?? place.source}</Badge></div>
        {detailLabels.length > 0 && <p className="mt-1 text-[11px] capitalize text-gray-500">{detailLabels.join(" · ")}</p>}
        <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-gray-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />{place.address}</p>
      </div>
      <a href={place.mapUrl} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} in ${place.source}`} className="shrink-0 text-gray-400 hover:text-indigo-600"><ExternalLink className="h-4 w-4" /></a>
    </div>
    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-primary">
      <a href={place.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">Public map record <ExternalLink className="h-3 w-3" /></a>
      {place.directionsUrl && <a href={place.directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">Directions <ExternalLink className="h-3 w-3" /></a>}
      <Link href={`/claim?${claimQuery.toString()}`} className="inline-flex items-center gap-1 hover:underline">Claim this page</Link>
    </div>
  </article>;
}

export function CommunityDirectoryPanel({ city, state, lat, lng }: CommunityDirectoryPanelProps) {
  const [kind, setKind] = useState<DirectoryKind>("churches");
  const [visibleCongregationCount, setVisibleCongregationCount] = useState(INITIAL_CONGREGATION_COUNT);
  const [showSupplemental, setShowSupplemental] = useState(false);
  const input = useMemo(() => ({ city: city ?? "", state: state ?? undefined, kind, lat, lng }), [city, state, kind, lat, lng]);
  const directory = trpc.communityDirectory.search.useQuery(input, {
    enabled: Boolean(city),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const selectedTab = DIRECTORY_TABS.find((tab) => tab.id === kind) ?? DIRECTORY_TABS[0];
  const primaryCongregations = directory.data?.mapResults ?? [];
  const visibleCongregations = primaryCongregations.slice(0, visibleCongregationCount);
  const remainingCongregations = Math.max(0, primaryCongregations.length - visibleCongregations.length);
  const supplementalMapResults = directory.data?.supplementalMapResults ?? [];

  useEffect(() => {
    setVisibleCongregationCount(INITIAL_CONGREGATION_COUNT);
    setShowSupplemental(false);
  }, [city, kind]);

  return (
    <section className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 p-4 sm:p-5" aria-labelledby="community-directory-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Community directory</Badge>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> No member information shared</span>
          </div>
          <h2 id="community-directory-heading" className="mt-2 text-xl font-bold text-gray-900">Every congregation & community help near {city ?? "you"}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">Everyone belongs here. The congregation directory searches the full public map inventory for the community you choose—it is not a short list of large churches or calendar partners.</p>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">{city ? `${city}${state ? `, ${state}` : ""}` : "Choose a city"}</span>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Community directory type">
        {DIRECTORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = kind === tab.id;
          return <button key={tab.id} type="button" role="tab" aria-selected={selected} onClick={() => setKind(tab.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-indigo-100 bg-white text-gray-700 hover:border-indigo-300"}`}><Icon className="h-4 w-4" />{tab.label}</button>;
        })}
      </div>

      {!city ? (
        <div className="mt-4 rounded-xl border border-dashed border-indigo-200 bg-white/80 p-4 text-sm text-gray-600">Choose a city or ZIP above to search that community’s congregations and help organizations.</div>
      ) : directory.isLoading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 p-4 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin text-indigo-600" />Searching the public community map inventory near {city}…</div>
      ) : directory.isError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The directory could not load right now. Try again in a moment or use the city search above.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {kind === "help" && (directory.data?.verifiedResources?.length ?? 0) > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-gray-900">Officially reviewed local help</h3><p className="text-xs text-gray-500">Public organization details and official links only</p></div>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {directory.data?.verifiedResources.map((resource) => (
                  <Card key={resource.name} className="border-emerald-100 bg-white shadow-sm"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Official site reviewed</Badge><h4 className="mt-2 font-bold text-gray-900">{resource.name}</h4></div><HandHeart className="h-5 w-5 shrink-0 text-emerald-600" /></div><p className="mt-2 text-sm leading-relaxed text-gray-600">{resource.summary}</p><p className="mt-3 flex items-start gap-1 text-xs text-gray-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />{resource.address}</p><div className="mt-3 flex flex-wrap gap-3"><a href={resource.accessUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Official services & access <ExternalLink className="h-3 w-3" /></a>{resource.officialEventsUrl && <a href={resource.officialEventsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Official events <ExternalLink className="h-3 w-3" /></a>}</div></CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {kind === "churches" ? (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-bold text-gray-900">Complete public congregation map inventory</h3><p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-gray-500">{directory.data?.congregationCoverage?.note}</p></div><Badge variant="outline" className="border-indigo-100 bg-white text-indigo-700">{primaryCongregations.length} public record{primaryCongregations.length === 1 ? "" : "s"}</Badge></div>
              {directory.data?.congregationCoverage?.available === false && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">The full map inventory is temporarily unavailable. The supplemental public map listings below may be incomplete; please try again later for comprehensive coverage.</div>}
              {primaryCongregations.length > 0 ? <><div className="mt-2 grid gap-2 sm:grid-cols-2">{visibleCongregations.map((place) => <MapListingCard key={place.directoryId} place={place} city={city} state={state} />)}</div>{remainingCongregations > 0 && <div className="mt-3 flex justify-center"><Button type="button" variant="outline" className="rounded-full bg-white" onClick={() => setVisibleCongregationCount((count) => count + CONGREGATION_INCREMENT)}>Show {Math.min(CONGREGATION_INCREMENT, remainingCongregations)} more congregation{Math.min(CONGREGATION_INCREMENT, remainingCongregations) === 1 ? "" : "s"}</Button></div>}</> : <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-white/70 p-4 text-sm text-gray-600">No public congregation records came back yet. Try again shortly or search a nearby ZIP code.</div>}
              {supplementalMapResults.length > 0 && <div className="mt-4 rounded-xl border border-gray-100 bg-white/70 p-3"><button type="button" className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-indigo-800" onClick={() => setShowSupplemental((shown) => !shown)} aria-expanded={showSupplemental}>Supplemental public map matches <span>{showSupplemental ? "Hide" : `Show ${supplementalMapResults.length}`}</span></button>{showSupplemental && <div className="mt-3 grid gap-2 sm:grid-cols-2">{supplementalMapResults.map((place) => <MapListingCard key={place.directoryId} place={place} sourceLabel="Supplemental Google Maps" city={city} state={state} />)}</div>}</div>}
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-bold text-gray-900">{selectedTab.label} found in public map listings</h3><p className="mt-0.5 text-xs text-gray-500">{directory.data?.mapResults.length ?? 0} public listing{(directory.data?.mapResults.length ?? 0) === 1 ? "" : "s"} found for {city}.</p></div></div>
              {(directory.data?.mapResults.length ?? 0) > 0 ? <div className="mt-2 grid gap-2 sm:grid-cols-2">{directory.data?.mapResults.map((place) => <MapListingCard key={place.directoryId} place={place} city={city} state={state} />)}</div> : <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-white/70 p-4 text-sm text-gray-600">No public map listings came back yet. Try a nearby ZIP code or widen the location in the city search.</div>}
            </div>
          )}

          <p className="rounded-lg bg-white/75 p-3 text-xs leading-relaxed text-gray-500">Public map records can be incomplete or out of date; the directory does not rank one faith community above another. Always use an organization’s official website to verify services, hours, accessibility, and events. Just Putzit does not send your profile, messages, booking history, or real-time location to any listing provider or congregation.</p>
        </div>
      )}
    </section>
  );
}
