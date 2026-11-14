/**
 * CityLanding — SEO-optimized landing page for each city.
 * Route: /city/:citySlug  (e.g. /city/jackson-ms, /city/madison-wi)
 *
 * Each page targets long-tail local search queries like:
 *   "dating app Jackson MS"
 *   "things to do in Jackson Mississippi"
 *   "meet people in Jackson MS"
 */
import { useParams, useLocation, Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Shield, Sparkles, Users, Star, ChevronRight, Calendar } from "lucide-react";
import { track } from "@/lib/analytics";
import { ACTIVITY_IDEAS, seasonForMonth } from "@shared/activityIdeas";
import { CITIES, type CityData } from "@shared/cities";
import { SITE_URL } from "@shared/site";

// Generate a generic city entry for unknown slugs
function buildGenericCity(slug: string): CityData {
  const parts = slug.split("-");
  const stateAbbr = parts[parts.length - 1]?.toUpperCase() ?? "";
  const cityParts = parts.slice(0, -1);
  const name = cityParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  return {
    name,
    state: stateAbbr,
    stateAbbr,
    slug,
    tagline: `Real Dates in ${name}, ${stateAbbr}`,
    description: `Meet locals in ${name} who actually want to go out. Find matches for activities, date nights, and real connections in your city.`,
    activities: ["Local dining", "Outdoor activities", "Live music", "Art & culture", "Sports events", "Community meetups"],
    neighborhoods: [],
    keywords: [`dating app ${name} ${stateAbbr}`, `things to do ${name}`, `meet people ${name}`, `date night ${name}`],
  };
}

/** Four date-friendly ideas that suit the current month, so every city page has concrete options. */
function pickDateIdeas() {
  const season = seasonForMonth(new Date().getMonth());
  const dateIdeas = ACTIVITY_IDEAS.filter((idea) => idea.bestFor.includes("date"));
  const inSeason = dateIdeas.filter((idea) => idea.seasons.includes(season));
  const picks = [...inSeason, ...dateIdeas.filter((idea) => !inSeason.includes(idea))];
  return picks.slice(0, 4);
}

/** Maps a city-page slug to the value the signup form accepts, where they overlap. */
const LAUNCH_CITIES_BY_SLUG: Record<string, string> = {
  "milwaukee-wi": "milwaukee",
};

export default function CityLanding() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [, navigate] = useLocation();
  const city = CITIES[citySlug ?? ""] ?? buildGenericCity(citySlug ?? "unknown");
  const cityDateIdeas = pickDateIdeas();

  const startSignup = (placement: string) => {
    track("city_cta_clicked", { placement, city: city.slug });
    // Only pass a city the signup form actually offers; other launch pages still reach sign-up.
    const launchCity = LAUNCH_CITIES_BY_SLUG[city.slug];
    navigate(launchCity ? `/signup?city=${launchCity}` : "/signup");
  };

  useSEO({
    title: `Dating App ${city.name} ${city.stateAbbr} — Just Putzit`,
    description: city.description,
    canonical: `${SITE_URL}/city/${city.slug}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `Just Putzit — ${city.name}`,
      "description": city.description,
      "url": `${SITE_URL}/city/${city.slug}`,
      "areaServed": {
        "@type": "City",
        "name": city.name,
        "containedInPlace": { "@type": "State", "name": city.state },
      },
      "applicationCategory": "SocialNetworkingApplication",
    },
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative gradient-warm min-h-[70vh] flex flex-col">
        {/* Nav */}
        <div className="container flex items-center justify-between py-5">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/brand/justputzit-logo-transparent_def33678.png" alt="Just Putzit" className="h-11 w-auto object-contain" />
          </button>
          <a
            href="/signup"
            onClick={(event) => {
              event.preventDefault();
              startSignup("header");
            }}
          >
            <Button className="gradient-sally text-white border-0 shadow-md rounded-full px-6">
              Join Free
            </Button>
          </a>
        </div>

        {/* Hero content */}
        <div className="container flex-1 flex flex-col items-center justify-center text-center py-16 gap-6">
          <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {city.name}, {city.state}
          </Badge>
          <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight max-w-3xl">
            The Dating App Built for <span className="text-primary">{city.name}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {city.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a
              href="/signup"
              onClick={(event) => {
                event.preventDefault();
                startSignup("hero");
              }}
            >
              <Button size="lg" className="gradient-sally text-white border-0 shadow-lg rounded-full px-8 text-lg gap-2">
                <Sparkles className="w-5 h-5" />
                Meet People in {city.name}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Safety Tools</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> AI-Matched</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-primary" /> Free to Join</span>
          </div>
        </div>
      </section>

      {/* Local Activities */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Things to Do in {city.name} with Your Match
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Just Putzit suggests real local activities based on what both of you love. No more "what do you want to do?" texts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {city.activities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{activity}</span>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <h3 className="text-center font-display text-2xl font-bold text-foreground">More date ideas for {city.name}</h3>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">Low-pressure plans that work even when you are still getting to know each other.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cityDateIdeas.map((idea) => (
                <Link key={idea.id} href="/things-to-do" className="no-underline">
                  <div className="h-full rounded-2xl border border-border bg-white p-4 transition-all hover:border-teal-300 hover:shadow-sm">
                    <span className="text-2xl" aria-hidden="true">{idea.emoji}</span>
                    <p className="mt-2 font-semibold leading-tight text-foreground">{idea.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{idea.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-10 rounded-3xl border border-teal-100 bg-teal-50/60 p-6 text-center">
            <h3 className="font-display text-2xl font-bold text-foreground">Need more than six ideas?</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Our Things to Do hub has {ACTIVITY_IDEAS.length} concrete plans — free walks, bowling nights, trivia, live music, classes, and seasonal outings — filtered by budget, time of day, and who is coming along.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild className="rounded-full bg-teal-700 text-white hover:bg-teal-800"><Link href="/things-to-do">See things to do in {city.name}</Link></Button>
              <Button asChild variant="outline" className="rounded-full border-teal-200 bg-white"><Link href="/entertainment">Concerts and showtimes</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How Just Putzit Works in {city.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", icon: "👵", title: "Meet Sally", desc: `Sally, our AI, learns your personality through a quick 90-second chat. She gets to know the real you — not just your photos.` },
              { step: "2", icon: "💙", title: "Get Matched", desc: `Sally matches you with ${city.name} locals who share your vibe, interests, and relationship goals. Quality over quantity.` },
              { step: "3", icon: "📍", title: "Go Out", desc: `Get activity suggestions tailored to ${city.name}. RSVP to local events together. Actually meet in person.` },
            ].map(s => (
              <div key={s.step} className="text-center p-8 rounded-3xl bg-white shadow-sm">
                <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg">{s.icon}</div>
                <Badge className="mb-3 bg-primary/10 text-primary border-0">{s.step}</Badge>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      {city.neighborhoods.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Serving All of {city.name}
            </h2>
            <p className="text-muted-foreground mb-8">Find matches near your neighborhood</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {city.neighborhoods.map(n => (
                <Badge key={n} className="bg-primary/10 text-primary border-0 rounded-full px-4 py-2 text-sm font-medium">
                  <MapPin className="w-3 h-3 mr-1" />{n}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 gradient-warm">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl">👵</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Meet Someone in {city.name}?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join free. No credit card. Sally matches you in minutes.
            </p>
            <a
              href="/signup"
              onClick={(event) => {
                event.preventDefault();
                startSignup("final_band");
              }}
            >
              <Button size="lg" className="gradient-sally text-white border-0 shadow-xl rounded-full px-10 text-lg gap-2">
                <Sparkles className="w-5 h-5" />
                Join Just Putzit — It's Free
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">GPS location confirmed · Real people only</p>
          </div>
        </div>
      </section>

      {/* Hidden SEO keywords (screen-reader accessible, not spammy) */}
      <div className="sr-only">
        <h2>Just Putzit in {city.name}, {city.state}</h2>
        {city.keywords.map(k => <span key={k}>{k} </span>)}
      </div>
    </div>
  );
}
