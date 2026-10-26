import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AdvisorAvatar } from "@/components/AdvisorAvatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ExternalLink, RefreshCw, Navigation, Search, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { MapView, addMarker, type MapInstance, type MapMarker } from "@/components/Map";
import { directionsUrl, searchNearbyPlaces } from "@/lib/maptiler";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { useUserCity } from "@/hooks/useUserCity";
import { useLocation } from "wouter";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { formatMilesAway, haversineDistanceMiles } from "@shared/geo";

type Place = {
  name: string;
  vicinity: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  placeId: string;
  lat: number;
  lng: number;
  openNow?: boolean;
  distanceMiles?: number;
};

const ACTIVITY_TYPES = [
  { label: "All", value: "establishment" },
  { label: "Libraries", value: "library" },
  { label: "Churches", value: "church" },
  { label: "Parks", value: "park" },
  { label: "Sports", value: "gym" },
  { label: "Cafes", value: "cafe" },
  { label: "Museums", value: "museum" },
];

export default function Activities() {
  const [, navigate] = useLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState("establishment");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const searchSeq = useRef(0);

  const { data: profile } = trpc.profile.get.useQuery();
  const { detectedCity } = useUserCity();
  const profileLocationMatchesDetectedCity = Boolean(
    profile?.gpsVerifiedLat &&
    profile?.gpsVerifiedLng &&
    detectedCity?.city &&
    profile?.gpsVerifiedCity?.toLowerCase().startsWith(detectedCity.city.toLowerCase()),
  );
  const trustedLocation = detectedCity?.lat !== undefined && detectedCity?.lng !== undefined
    ? { lat: detectedCity.lat, lng: detectedCity.lng }
    : profileLocationMatchesDetectedCity
      ? { lat: Number(profile?.gpsVerifiedLat), lng: Number(profile?.gpsVerifiedLng) }
      : null;
  const updateLocation = trpc.profile.update.useMutation();
  const { data: featuredPartners = [] } = trpc.advertising.getFeaturedPartners.useQuery(
    { city: profile?.city || undefined },
    { enabled: true, staleTime: 60_000 }
  );

  const searchNearby = async (map: MapInstance, location: { lat: number; lng: number }, type: string) => {
    const seq = ++searchSeq.current;
    setIsLoading(true);
    setPlaces([]);
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    try {
      const found = await searchNearbyPlaces(location, type, { radiusMeters: 5000, max: 12 });
      if (seq !== searchSeq.current) return; // a newer search started while this one was loading
      const mapped: Place[] = found.map(r => ({
        name: r.name || "Unknown",
        vicinity: r.address,
        types: r.categories,
        placeId: r.id,
        lat: r.lat,
        lng: r.lng,
        distanceMiles: haversineDistanceMiles(location.lat, location.lng, r.lat, r.lng),
      }));
      setPlaces(mapped);
      // Add markers
      mapped.forEach(place => {
        markersRef.current.push(addMarker(map, { lat: place.lat, lng: place.lng, label: place.name }));
      });
    } catch {
      if (seq === searchSeq.current) toast.error("Couldn't load nearby places");
    } finally {
      if (seq === searchSeq.current) setIsLoading(false);
    }
  };

  const handleMapReady = (map: MapInstance) => {
    mapRef.current = map;
    if (trustedLocation) {
      setUserLocation(trustedLocation);
      map.setCenter(trustedLocation);
      map.setZoom(14);
      searchNearby(map, trustedLocation, activeType);
    }
    if (!navigator.geolocation) {
      if (!trustedLocation) setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        map.setCenter(loc);
        map.setZoom(14);
        // User marker
        addMarker(map, { lat: loc.lat, lng: loc.lng, label: "You are here", color: "#2563eb" });
        updateLocation.mutate({ latitude: String(loc.lat), longitude: String(loc.lng) });
        searchNearby(map, loc, activeType);
      },
      () => {
        if (trustedLocation) {
          setLocationError(null);
          return;
        }
        setLocationError("Location access denied. Please allow location to see nearby activities.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    if (!mapRef.current || userLocation || !trustedLocation) return;
    setUserLocation(trustedLocation);
    mapRef.current.setCenter(trustedLocation);
    mapRef.current.setZoom(14);
    searchNearby(mapRef.current, trustedLocation, activeType);
  }, [trustedLocation?.lat, trustedLocation?.lng, userLocation, activeType]);

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    if (mapRef.current && userLocation) {
      searchNearby(mapRef.current, userLocation, type);
    }
  };

  const getTypeLabel = (types: string[]) => {
    const map: Record<string, string> = {
      library: "📚 Library", church: "⛪ Church", park: "🌳 Park",
      gym: "🏋️ Sports", cafe: "☕ Cafe", museum: "🏛️ Museum",
      restaurant: "🍽️ Restaurant", school: "🏫 School",
    };
    for (const t of types) {
      if (map[t]) return map[t];
    }
    return "📍 Venue";
  };

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl text-foreground">Local Activities 🗺️</h1>
          <p className="text-muted-foreground mt-1">Discover nearby places to explore with your matches</p>
        </div>
        <div className="mb-6 max-w-xl">
          <LocationOverrideControl compact />
        </div>

        {/* Sally suggestion */}
        <div className="bg-white rounded-3xl p-4 mb-6 flex items-start gap-3 shadow-sm">
          <AdvisorAvatar size="md" />
          <div>
            <p className="font-semibold text-sm">Sally's suggestion</p>
            <p className="text-xs text-muted-foreground">
              {profile?.traits && (profile.traits as any).hobbies
                ? `Based on your love of ${((profile.traits as any).hobbies as string[]).slice(0, 2).join(" and ")}, here are some great spots nearby!`
                : "Here are some great spots nearby to explore with your matches!"}
            </p>
          </div>
        </div>

        {/* Personal activity: intentionally separate from official nearby-place results. */}
        <section className="mb-6 rounded-3xl border border-rose-100 bg-gradient-to-r from-white via-rose-50/70 to-amber-50/70 p-4 shadow-sm" aria-labelledby="daily-horoscope-activity">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AdvisorAvatar size="md" />
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  <p id="daily-horoscope-activity" className="text-sm font-bold text-foreground">Sally’s Daily Horoscope</p>
                  <Badge className="border-0 bg-white/80 text-[10px] text-rose-700">Personal activity</Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">Take a quick, playful pause for today’s reflection and a gentle nudge from Sally.</p>
              </div>
            </div>
            <Button size="sm" className="shrink-0 rounded-full gap-2 bg-rose-600 text-white hover:bg-rose-700" onClick={() => navigate("/horoscope")}>
              Open horoscope <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </section>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search places by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-12 text-base rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Local venue banner ad slot */}
        <LocalVenueBanner page="activities" className="mb-4" />

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ACTIVITY_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeType === t.value ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary"}`}
            >
              {t.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="rounded-full gap-1.5" onClick={() => { if (mapRef.current && userLocation) searchNearby(mapRef.current, userLocation, activeType); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {locationError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">{locationError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <MapView
              className="h-96 lg:h-[480px]"
              initialCenter={{ lat: 39.8283, lng: -98.5795 }}
              initialZoom={4}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Places list */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 480 }}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
              ))
            ) : places.length > 0 ? (
              (() => {
                const filtered = searchQuery
                  ? places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.vicinity.toLowerCase().includes(searchQuery.toLowerCase()))
                  : places;
                return filtered.length > 0
                  ? filtered.map(place => <PlaceCard key={place.placeId} place={place} typeLabel={getTypeLabel(place.types)} isFeatured={featuredPartners.some(fp => place.name.toLowerCase().includes(fp.businessName.toLowerCase()) || fp.businessName.toLowerCase().includes(place.name.toLowerCase()))} />)
                  : <div className="bg-white rounded-3xl p-8 text-center"><div className="text-4xl mb-3">🔍</div><p className="font-semibold">No matches for "{searchQuery}"</p><p className="text-sm text-muted-foreground mt-1">Try a different name or clear the search</p></div>;
              })()
            ) : !userLocation && !locationError ? (
              <div className="bg-white rounded-3xl p-8 text-center">
                <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <p className="font-semibold">Getting your location...</p>
                <p className="text-sm text-muted-foreground mt-1">Please allow location access when prompted</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="font-semibold">No places found nearby</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, typeLabel, isFeatured }: { place: Place; typeLabel: string; isFeatured?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border card-hover ${isFeatured ? "border-amber-300 ring-1 ring-amber-200" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-xs rounded-full">{typeLabel}</Badge>
            {isFeatured && <Badge className="text-xs rounded-full bg-amber-100 text-amber-700 border-0 gap-1"><Star className="w-3 h-3 fill-amber-500" />Featured Partner</Badge>}
            {place.openNow !== undefined && (
              <Badge className={`text-xs rounded-full border-0 ${place.openNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {place.openNow ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
          <p className="font-bold text-sm truncate">{place.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {place.vicinity}
            {place.distanceMiles !== undefined && <span className="ml-auto text-primary font-medium">{formatMilesAway(place.distanceMiles)}</span>}
          </p>
          {place.rating && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-500" /> {place.rating} ({place.userRatingsTotal?.toLocaleString()} reviews)
            </p>
          )}
        </div>
        <a href={directionsUrl(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs">
            <ExternalLink className="w-3 h-3" /> View
          </Button>
        </a>
      </div>
    </div>
  );
}
