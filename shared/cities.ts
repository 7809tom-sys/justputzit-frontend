/**
 * City landing-page data, shared by the /city/:citySlug page and the build-time prerender
 * (sitemap and static HTML), so both always describe the same cities.
 */
export interface CityData {
  name: string;
  state: string;
  stateAbbr: string;
  slug: string;
  tagline: string;
  description: string;
  activities: string[];
  neighborhoods: string[];
  keywords: string[];
}

export const CITIES: Record<string, CityData> = {
  "jackson-ms": {
    name: "Jackson",
    state: "Mississippi",
    stateAbbr: "MS",
    slug: "jackson-ms",
    tagline: "Real Dates in Jackson, MS",
    description: "Meet locals in Jackson who actually want to go out — not just text. Find matches for date nights, outdoor activities, and real connections across the Capital City.",
    activities: ["Fondren District dining", "LeFleur's Bluff State Park hikes", "Mississippi Museum of Art", "Belhaven neighborhood walks", "Local music venues", "Reservoir kayaking"],
    neighborhoods: ["Fondren", "Belhaven", "Ridgeland", "Brandon", "Madison", "Flowood"],
    keywords: ["dating app Jackson MS", "things to do Jackson Mississippi", "meet people Jackson MS", "date night Jackson Mississippi", "activities Jackson MS"],
  },
  "madison-wi": {
    name: "Madison",
    state: "Wisconsin",
    stateAbbr: "WI",
    slug: "madison-wi",
    tagline: "Real Dates in Madison, WI",
    description: "Connect with locals in Madison who love the outdoors, the food scene, and real in-person experiences. Find your match for lake days, State Street adventures, and more.",
    activities: ["Lake Mendota paddleboarding", "State Street dining", "Farmer's Market on the Square", "Arboretum hiking", "Terrace sunsets at Memorial Union", "Comedy club nights"],
    neighborhoods: ["Downtown", "Willy Street", "Middleton", "Fitchburg", "Verona", "Sun Prairie"],
    keywords: ["dating app Madison WI", "things to do Madison Wisconsin", "meet people Madison WI", "date night Madison Wisconsin", "activities Madison WI"],
  },
  "milwaukee-wi": {
    name: "Milwaukee",
    state: "Wisconsin",
    stateAbbr: "WI",
    slug: "milwaukee-wi",
    tagline: "Real Dates in Milwaukee, WI",
    description: "Milwaukee's dating scene just got better. Meet locals for lakefront walks, brewery tours, Summerfest, and real connections in the Cream City.",
    activities: ["Milwaukee Art Museum", "Lakefront Brewery tours", "Third Ward dining", "Bradford Beach", "Pabst Mansion tours", "Milwaukee Bucks games"],
    neighborhoods: ["Third Ward", "Bay View", "Riverwest", "Shorewood", "Wauwatosa", "Brookfield"],
    keywords: ["dating app Milwaukee WI", "things to do Milwaukee Wisconsin", "meet people Milwaukee WI", "date night Milwaukee Wisconsin", "activities Milwaukee WI"],
  },
  "chicago-il": {
    name: "Chicago",
    state: "Illinois",
    stateAbbr: "IL",
    slug: "chicago-il",
    tagline: "Real Dates in Chicago, IL",
    description: "Chicago has endless date options — and Just Putzit helps you find someone to actually go with. Meet locals for deep dish, lakefront runs, rooftop bars, and real connections.",
    activities: ["Millennium Park", "Navy Pier", "Chicago Riverwalk", "Lincoln Park Zoo", "Deep dish pizza crawl", "Chicago Architecture boat tour"],
    neighborhoods: ["Wicker Park", "Lincoln Park", "Logan Square", "River North", "Wrigleyville", "Hyde Park"],
    keywords: ["dating app Chicago IL", "things to do Chicago Illinois", "meet people Chicago IL", "date night Chicago Illinois", "activities Chicago IL"],
  },
  "atlanta-ga": {
    name: "Atlanta",
    state: "Georgia",
    stateAbbr: "GA",
    slug: "atlanta-ga",
    tagline: "Real Dates in Atlanta, GA",
    description: "ATL has the culture, the food, and the energy. Just Putzit connects you with Atlanta locals for real dates — Beltline walks, rooftop bars, and everything in between.",
    activities: ["Atlanta BeltLine", "Ponce City Market", "Piedmont Park", "Georgia Aquarium", "Little Five Points", "Rooftop bar hopping"],
    neighborhoods: ["Midtown", "Buckhead", "Little Five Points", "East Atlanta", "Decatur", "Smyrna"],
    keywords: ["dating app Atlanta GA", "things to do Atlanta Georgia", "meet people Atlanta GA", "date night Atlanta Georgia", "activities Atlanta GA"],
  },
};

export const CITY_SLUGS = Object.keys(CITIES);
