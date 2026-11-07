export type EntertainmentListing = {
  id: number;
  title: string;
  category: string;
  eventDate: Date;
  venueName?: string | null;
  city: string;
  isFree: boolean;
  externalUrl?: string | null;
};

const entertainmentTerms =
  /music|concert|festival|theat(?:er|re)|movie|film|comedy|art|show|performance|dance|book|game|night/i;
const entertainmentCategories = new Set(["music", "arts", "community"]);

export function filterCurrentEntertainment(
  listings: EntertainmentListing[],
  now = new Date()
) {
  return listings
    .filter(listing => new Date(listing.eventDate) >= now)
    .filter(
      listing =>
        entertainmentCategories.has(listing.category) ||
        entertainmentTerms.test(listing.title)
    )
    .sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    )
    .slice(0, 12);
}

export function filterVenueListings(
  listings: EntertainmentListing[],
  venueName: string,
  now = new Date()
) {
  return listings
    .filter(listing => new Date(listing.eventDate) >= now)
    .filter(
      listing => listing.venueName?.toLowerCase() === venueName.toLowerCase()
    )
    .sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    )
    .slice(0, 4);
}

/** An official source the member can trust for final times, tickets, and accessibility details. */
export type EntertainmentCalendar = {
  title: string;
  detail: string;
  href: string;
  label: string;
  /** Supported city this source covers, or "any" for sources that work everywhere. */
  city: string;
  /** Every entertainment filter this source is genuinely useful for. */
  kinds: EntertainmentKind[];
};

export type EntertainmentKind =
  | "all"
  | "live_music"
  | "comedy"
  | "karaoke"
  | "theatre"
  | "film"
  | "festival"
  | "family";

export function matchesEntertainmentKind(
  event: Pick<EntertainmentListing, "title" | "venueName" | "category">,
  kind: EntertainmentKind
) {
  if (kind === "all") return true;
  const text = `${event.title} ${event.venueName ?? ""}`.toLowerCase();
  switch (kind) {
    case "karaoke":
      return /karaoke/.test(text);
    case "comedy":
      return /comedy|comic|improv|stand-?up/.test(text);
    case "theatre":
      return /theat(?:er|re)|play|musical|stage|broadway|panto/.test(text);
    case "film":
      return (
        /film|movie|cinema|screening/.test(text) || event.category === "arts"
      );
    case "festival":
      return /festival|fest\b|fair|fiesta|celebration|carnival/.test(text);
    case "family":
      return /family|kids|children|puppet|story time|matinee/.test(text);
    default:
      return (
        /live music|live band|\bband\b|open mic|jazz|acoustic|concert|dj/.test(
          text
        ) || event.category === "music"
      );
  }
}

/**
 * Official calendars and venue sources, grouped around the cities Just Putzit serves.
 * These are the pages members should trust for final times, tickets, and accessibility details.
 */
export const officialEntertainmentCalendars: EntertainmentCalendar[] = [
  // ── Waukesha ────────────────────────────────────────────────────────────────
  {
    title: "Downtown Waukesha",
    detail:
      "Friday Night Live, outdoor movies, Riverside Rhythms, and seasonal downtown events.",
    href: "https://www.downtownwaukesha.com/calendar/",
    label: "View calendar",
    city: "Waukesha",
    kinds: ["festival", "live_music", "family"],
  },
  {
    title: "Waukesha Civic Theatre",
    detail: "Local theatre, guest acts, cabaret, and community performances.",
    href: "https://www.waukeshacivictheatre.org/box-office/upcoming-shows/",
    label: "Upcoming shows",
    city: "Waukesha",
    kinds: ["theatre", "family"],
  },
  {
    title: "Waukesha Public Library",
    detail:
      "Author talks, films, book clubs, tabletop games, and free public programs.",
    href: "https://waukesha.librarycalendar.com/events/upcoming",
    label: "Library calendar",
    city: "Waukesha",
    kinds: ["family", "film"],
  },
  {
    title: "Marcus Majestic Cinema of Brookfield",
    detail:
      "Current showtimes and ticket information for the nearest full-size multiplex.",
    href: "https://www.marcustheatres.com/theatre-locations/majestic-cinema-of-brookfield",
    label: "See showtimes",
    city: "Waukesha",
    kinds: ["film", "family"],
  },
  {
    title: "Waukesha County Parks",
    detail:
      "Trail conditions, Retzer Nature Center programs, and seasonal park events.",
    href: "https://www.waukeshacounty.gov/parks/",
    label: "Park programs",
    city: "Waukesha",
    kinds: ["family", "festival"],
  },
  // ── Milwaukee ───────────────────────────────────────────────────────────────
  {
    title: "Pabst Theater Group",
    detail:
      "Riverside, Pabst, and Turner Hall — touring bands, comedy, and seated shows.",
    href: "https://www.pabsttheatergroup.com/events",
    label: "Browse shows",
    city: "Milwaukee",
    kinds: ["live_music", "comedy", "theatre"],
  },
  {
    title: "Milwaukee Symphony Orchestra",
    detail:
      "Classical, pops, and film-with-orchestra programs at the Bradley Symphony Center.",
    href: "https://www.mso.org/",
    label: "Concert calendar",
    city: "Milwaukee",
    kinds: ["live_music", "family"],
  },
  {
    title: "Milwaukee Rep",
    detail:
      "Professional theatre across the Quadracci Powerhouse and Stackner Cabaret stages.",
    href: "https://www.milwaukeerep.com/tickets/",
    label: "Season & tickets",
    city: "Milwaukee",
    kinds: ["theatre", "family"],
  },
  {
    title: "Milwaukee Art Museum",
    detail:
      "Exhibitions, gallery talks, film series, and Friday-evening museum nights.",
    href: "https://mam.org/calendar/",
    label: "Exhibitions & events",
    city: "Milwaukee",
    kinds: ["film", "family", "festival"],
  },
  {
    title: "Marcus Center",
    detail: "Broadway tours, dance companies, and family programming downtown.",
    href: "https://www.marcuscenter.org/events/",
    label: "Upcoming events",
    city: "Milwaukee",
    kinds: ["theatre", "family", "live_music"],
  },
  {
    title: "ComedySportz Milwaukee",
    detail:
      "Clean improv comedy with an all-ages early show and a late-night adults show.",
    href: "https://www.comedysportzmilwaukee.com/shows",
    label: "Show times",
    city: "Milwaukee",
    kinds: ["comedy", "family"],
  },
  {
    title: "Milwaukee Improv",
    detail: "Stand-up headliners and open-mic nights in the Third Ward.",
    href: "https://www.milwaukeeimprov.com/",
    label: "Lineup & tickets",
    city: "Milwaukee",
    kinds: ["comedy"],
  },
  {
    title: "Milwaukee Film",
    detail:
      "Repertory screenings, the Oriental Theatre, and the Milwaukee Film Festival.",
    href: "https://www.milwaukeefilm.org/",
    label: "Screenings",
    city: "Milwaukee",
    kinds: ["film", "festival"],
  },
  {
    title: "Shank Hall",
    detail:
      "A 300-capacity room that books touring rock, blues, and tribute acts.",
    href: "https://www.shankhall.com/",
    label: "Concert calendar",
    city: "Milwaukee",
    kinds: ["live_music", "karaoke"],
  },
  {
    title: "Milwaukee County Zoo",
    detail: "Family days, keeper talks, and seasonal evening events.",
    href: "https://www.milwaukeezoo.org/events/",
    label: "Zoo events",
    city: "Milwaukee",
    kinds: ["family", "festival"],
  },
  {
    title: "Milwaukee Recreation",
    detail:
      "Low-cost classes, open gyms, pools, and neighborhood special events.",
    href: "https://mkerec.net/",
    label: "Programs & events",
    city: "Milwaukee",
    kinds: ["family", "festival", "live_music"],
  },
  {
    title: "Milwaukee Public Market",
    detail:
      "Food halls, cooking demos, and market-hosted tastings and classes.",
    href: "https://www.milwaukeepublicmarket.org/",
    label: "Market events",
    city: "Milwaukee",
    kinds: ["festival", "family"],
  },
  // ── Chicago ─────────────────────────────────────────────────────────────────
  {
    title: "Choose Chicago",
    detail:
      "Festivals, concerts, performances, and citywide entertainment across Chicago.",
    href: "https://www.choosechicago.com/events/",
    label: "Explore events",
    city: "Chicago",
    kinds: ["festival", "live_music", "theatre", "comedy"],
  },
  {
    title: "Chicago Park District",
    detail:
      "Free concerts, movies in the parks, and neighborhood cultural programming.",
    href: "https://www.chicagoparkdistrict.com/events",
    label: "Park events",
    city: "Chicago",
    kinds: ["family", "festival", "film"],
  },
  {
    title: "Chicago Public Library",
    detail:
      "Author events, film screenings, and free workshops across every branch.",
    href: "https://www.chipublib.org/events/",
    label: "Library events",
    city: "Chicago",
    kinds: ["family", "film"],
  },
  {
    title: "Art Institute of Chicago",
    detail:
      "Exhibitions, lectures, and film programs at one of the country's major museums.",
    href: "https://www.artic.edu/",
    label: "Exhibitions",
    city: "Chicago",
    kinds: ["film", "family", "festival"],
  },
  // ── Brookfield, West Allis, Wauwatosa ───────────────────────────────────────
  {
    title: "Brookfield Public Library",
    detail:
      "Book groups, story times, maker programs, and free community classes.",
    href: "https://www.brookfieldlibrary.org/events",
    label: "Library calendar",
    city: "Brookfield",
    kinds: ["family", "film"],
  },
  {
    title: "Marcus Menomonee Falls Cinema",
    detail: "Showtimes and tickets for the closest west-suburban multiplex.",
    href: "https://www.marcustheatres.com/theatre-locations/menomonee-falls-cinema",
    label: "See showtimes",
    city: "Brookfield",
    kinds: ["film", "family"],
  },
  {
    title: "West Allis community calendar",
    detail: "City festivals, farmers markets, and library and park programs.",
    href: "https://www.westalliswi.gov/Calendar.aspx",
    label: "City calendar",
    city: "West Allis",
    kinds: ["festival", "family", "live_music"],
  },
  {
    title: "Wauwatosa Public Library",
    detail: "Author visits, book clubs, teen programs, and free family events.",
    href: "https://www.wauwatosalibrary.org/events",
    label: "Library calendar",
    city: "Wauwatosa",
    kinds: ["family", "film"],
  },
  // ── Other supported cities ─────────────────────────────────────────────────
  {
    title: "Madison Public Library",
    detail:
      "Free lectures, film nights, and community programs across the library system.",
    href: "https://www.madisonpubliclibrary.org/events",
    label: "Library calendar",
    city: "Madison",
    kinds: ["family", "film"],
  },
  {
    title: "Isthmus events",
    detail: "Madison's weekly arts, music, and theatre listings.",
    href: "https://www.isthmus.com/events/",
    label: "Weekly listings",
    city: "Madison",
    kinds: ["live_music", "theatre", "comedy", "festival"],
  },
  {
    title: "Naperville Public Library",
    detail:
      "Concerts, author talks, and family programs across three branches.",
    href: "https://www.naperville-lib.org/events",
    label: "Library calendar",
    city: "Naperville",
    kinds: ["family", "film"],
  },
  {
    title: "Evanston community events",
    detail:
      "Downtown festivals, lakefront concerts, and city-hosted programming.",
    href: "https://www.cityofevanston.org/events",
    label: "City calendar",
    city: "Evanston",
    kinds: ["festival", "family", "live_music"],
  },
  {
    title: "Joliet Public Library",
    detail: "Free classes, film screenings, and family programming.",
    href: "https://www.jolietlibrary.org/",
    label: "Library calendar",
    city: "Joliet",
    kinds: ["family", "film"],
  },
  {
    title: "Green Bay city calendar",
    detail: "City-hosted festivals, park concerts, and community events.",
    href: "https://www.greenbaywi.gov/Calendar.aspx",
    label: "City calendar",
    city: "Green Bay",
    kinds: ["festival", "family", "live_music"],
  },
  {
    title: "Racine Public Library",
    detail: "Programs, book clubs, and free events for all ages.",
    href: "https://www.racinelibrary.info/",
    label: "Library calendar",
    city: "Racine",
    kinds: ["family", "film"],
  },
  // ── Works from any city ────────────────────────────────────────────────────
  {
    title: "Eventbrite",
    detail:
      "Ticketed local events, classes, and pop-ups, searchable by city and date.",
    href: "https://www.eventbrite.com/d/wi--milwaukee/events/",
    label: "Search tickets",
    city: "any",
    kinds: [
      "festival",
      "live_music",
      "comedy",
      "theatre",
      "film",
      "family",
      "karaoke",
    ],
  },
  {
    title: "Meetup",
    detail:
      "Hobby groups, game nights, and social meetups happening this week.",
    href: "https://www.meetup.com/find/?location=us--wi--Milwaukee&source=EVENTS",
    label: "Find groups",
    city: "any",
    kinds: ["live_music", "karaoke", "comedy", "festival"],
  },
  {
    title: "Fandango showtimes",
    detail:
      "Every nearby cinema's showtimes in one place when you just want a movie.",
    href: "https://www.fandango.com/milwaukee_wi_movietimes",
    label: "Showtimes",
    city: "any",
    kinds: ["film"],
  },
  {
    title: "Wisconsin State Fair",
    detail: "Grandstand concerts, free stages, and the annual fair dates.",
    href: "https://wistatefair.com/",
    label: "Fair lineup",
    city: "any",
    kinds: ["festival", "live_music", "family"],
  },
];

/** Sources that apply to the member's city first, then the always-useful national directories. */
export function calendarsForCity(
  city: string | undefined,
  kind: EntertainmentKind = "all"
) {
  const normalized = (city ?? "").trim().toLowerCase();
  return officialEntertainmentCalendars
    .filter(calendar => kind === "all" || calendar.kinds.includes(kind))
    .sort((a, b) => {
      const rank = (calendar: EntertainmentCalendar) => {
        if (normalized && calendar.city.toLowerCase() === normalized) return 0;
        if (calendar.city === "any") return 1;
        return 2;
      };
      return rank(a) - rank(b);
    });
}

/** Only the sources in the member's own city, for compact "official sources near you" rows. */
export function calendarsNearCity(
  city: string | undefined,
  kind: EntertainmentKind = "all"
) {
  const normalized = (city ?? "").trim().toLowerCase();
  if (!normalized) return [];
  return officialEntertainmentCalendars.filter(
    calendar =>
      calendar.city.toLowerCase() === normalized &&
      (kind === "all" || calendar.kinds.includes(kind))
  );
}
