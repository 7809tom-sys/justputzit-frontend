/**
 * A curated catalog of things to actually do around town, used by the Things to Do hub.
 *
 * Every idea carries the keywords we hand to the place search (MapTiler) so the hub can pair
 * "bowling night" with real bowling alleys close to the member, plus an optional official
 * source the member can trust for hours, tickets, or reservations.
 */

export const ACTIVITY_IDEA_CATEGORIES = [
  { id: "outdoors", label: "Outdoors", emoji: "🥾" },
  { id: "food_drink", label: "Food & Drink", emoji: "🍽️" },
  { id: "arts_culture", label: "Arts & Culture", emoji: "🎨" },
  { id: "games", label: "Games & Competition", emoji: "🎯" },
  { id: "music_nightlife", label: "Music & Nightlife", emoji: "🎶" },
  { id: "fitness", label: "Fitness & Sports", emoji: "🏅" },
  { id: "community", label: "Community & Giving Back", emoji: "🤝" },
  { id: "seasonal", label: "Seasonal & One-Off", emoji: "🍂" },
] as const;

export type ActivityIdeaCategory =
  (typeof ACTIVITY_IDEA_CATEGORIES)[number]["id"];
export type ActivityIdeaTime = "morning" | "afternoon" | "evening";
export type ActivityIdeaSeason = "spring" | "summer" | "fall" | "winter";
export type ActivityIdeaGroup = "date" | "friends" | "family" | "solo";
export type ActivityIdeaBudget = "free" | "cheap" | "splurge";
export type ActivityIdeaSetting = "indoor" | "outdoor" | "either";

export type ActivityIdeaLink = { label: string; href: string };

export type ActivityIdea = {
  id: string;
  title: string;
  emoji: string;
  category: ActivityIdeaCategory;
  summary: string;
  /** Place-search keywords used to find real venues nearby. */
  searchKeywords: string[];
  bestFor: ActivityIdeaGroup[];
  budget: ActivityIdeaBudget;
  setting: ActivityIdeaSetting;
  times: ActivityIdeaTime[];
  seasons: ActivityIdeaSeason[];
  /** Practical nudge shown with the idea, never a guarantee about a specific venue. */
  tip?: string;
  officialLinks?: ActivityIdeaLink[];
};

const ALL_SEASONS: ActivityIdeaSeason[] = [
  "spring",
  "summer",
  "fall",
  "winter",
];
const ALL_TIMES: ActivityIdeaTime[] = ["morning", "afternoon", "evening"];

export const ACTIVITY_IDEAS: ActivityIdea[] = [
  {
    id: "disc-golf",
    title: "Disc golf round",
    emoji: "🥏",
    category: "outdoors",
    summary:
      "Nine holes on a free public course, with plenty of walking and laughing at bad throws.",
    searchKeywords: ["disc golf", "golf course"],
    bestFor: ["friends", "date"],
    budget: "free",
    setting: "outdoor",
    times: ["afternoon"],
    seasons: ["spring", "summer", "fall"],
    tip: "Many park courses are free; a starter disc set is the only cost.",
  },
  {
    id: "trail-hike",
    title: "Trail hike",
    emoji: "🥾",
    category: "outdoors",
    summary:
      "Pick a loop trail, bring water, and let the conversation run the length of the path.",
    searchKeywords: ["hiking area", "nature reserve", "park"],
    bestFor: ["friends", "date", "solo"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["spring", "summer", "fall"],
    tip: "State park trails may need a vehicle admission sticker.",
    officialLinks: [
      {
        label: "Find a Wisconsin state park",
        href: "https://dnr.wisconsin.gov/topic/parks/findapark",
      },
    ],
  },
  {
    id: "lake-paddle",
    title: "Kayak or paddleboard the lake",
    emoji: "🛶",
    category: "outdoors",
    summary:
      "Rentals at most marinas, a calm morning on the water, and a very good first-date story.",
    searchKeywords: ["marina", "boat rental", "beach"],
    bestFor: ["date", "friends"],
    budget: "cheap",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["summer"],
    tip: "Check the rental shop's weather and life-jacket policy before you commit.",
  },
  {
    id: "botanical-garden",
    title: "Wander a botanical garden",
    emoji: "🌷",
    category: "outdoors",
    summary:
      "Slow, scenic, and easy to talk through — gardens are the calmest date in town.",
    searchKeywords: ["botanical garden", "park"],
    bestFor: ["date", "family"],
    budget: "cheap",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["spring", "summer"],
    officialLinks: [
      {
        label: "Boerner Botanical Gardens",
        href: "https://www.boernerbotanicalgardens.org/",
      },
    ],
  },
  {
    id: "farmers-market",
    title: "Saturday farmers market",
    emoji: "🧺",
    category: "food_drink",
    summary:
      "Grab coffee, split a pastry, and build a picnic from whatever looks good that morning.",
    searchKeywords: ["farmers market", "market"],
    bestFor: ["date", "family", "solo"],
    budget: "cheap",
    setting: "outdoor",
    times: ["morning"],
    seasons: ["spring", "summer", "fall"],
    tip: "Most markets run weekend mornings and wind down by early afternoon.",
    officialLinks: [
      {
        label: "Milwaukee Public Market",
        href: "https://www.milwaukeepublicmarket.org/",
      },
    ],
  },
  {
    id: "sunset-viewpoint",
    title: "Catch a sunset from a lookout",
    emoji: "🌇",
    category: "outdoors",
    summary:
      "Free, short, and reliably memorable — bring a blanket and something warm to sip.",
    searchKeywords: ["scenic viewpoint", "park", "beach"],
    bestFor: ["date", "friends"],
    budget: "free",
    setting: "outdoor",
    times: ["evening"],
    seasons: ["spring", "summer", "fall"],
  },
  {
    id: "ice-skating",
    title: "Ice skating",
    emoji: "⛸️",
    category: "seasonal",
    summary:
      "Open skates at rinks and pop-up outdoor rinks are classic winter dates and family outings.",
    searchKeywords: ["ice rink", "skating rink"],
    bestFor: ["date", "family"],
    budget: "cheap",
    setting: "either",
    times: ["afternoon", "evening"],
    seasons: ["winter"],
    tip: "Rinks publish open-skate windows separately from hockey time — check before you go.",
  },
  {
    id: "nature-center",
    title: "Nature center walk",
    emoji: "🦉",
    category: "outdoors",
    summary:
      "Short trails, exhibits, and staff who know what is blooming or nesting this week.",
    searchKeywords: ["nature reserve", "visitor center", "park"],
    bestFor: ["family", "friends", "solo"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Wehr Nature Center",
        href: "https://www.wehrnaturecenter.org/",
      },
    ],
  },
  {
    id: "lighthouse-walk",
    title: "Lighthouse and lakefront walk",
    emoji: "🌊",
    category: "outdoors",
    summary:
      "A lakefront path, a lighthouse, and a bench worth sitting on for a while.",
    searchKeywords: ["lighthouse", "park", "beach"],
    bestFor: ["date", "friends"],
    budget: "free",
    setting: "outdoor",
    times: ["afternoon", "evening"],
    seasons: ["spring", "summer", "fall"],
    officialLinks: [
      {
        label: "North Point Lighthouse",
        href: "https://northpointlighthouse.org/",
      },
    ],
  },
  {
    id: "brewery-tour",
    title: "Local brewery tour",
    emoji: "🍺",
    category: "food_drink",
    summary:
      "Tasting flights, a taproom tour, and a low-key way to learn what your city brews.",
    searchKeywords: ["brewery", "bar"],
    bestFor: ["date", "friends"],
    budget: "cheap",
    setting: "indoor",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
    tip: "Most taprooms welcome well-behaved kids early in the day; check the house rules.",
    officialLinks: [
      { label: "Lakefront Brewery", href: "https://www.lakefrontbrewery.com/" },
      {
        label: "Eagle Park Brewing",
        href: "https://www.eagleparkbrewing.com/",
      },
    ],
  },
  {
    id: "cooking-class",
    title: "Hands-on cooking class",
    emoji: "👩‍🍳",
    category: "food_drink",
    summary:
      "Learn one dish properly, eat it together, and leave with a recipe you will actually reuse.",
    searchKeywords: ["cooking school", "culinary school"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Brewbakers cooking classes",
        href: "https://www.brewbakers.com/",
      },
    ],
  },
  {
    id: "coffee-crawl",
    title: "Coffee shop crawl",
    emoji: "☕",
    category: "food_drink",
    summary:
      "Two or three independent cafés in one afternoon, comparing the espresso and the playlist.",
    searchKeywords: ["cafe", "coffee shop"],
    bestFor: ["date", "friends", "solo"],
    budget: "cheap",
    setting: "indoor",
    times: ["morning", "afternoon"],
    seasons: ALL_SEASONS,
  },
  {
    id: "food-truck-night",
    title: "Food truck night",
    emoji: "🌮",
    category: "food_drink",
    summary:
      "Several trucks, one park, and enough options for the pickiest person in the group.",
    searchKeywords: ["food truck", "park"],
    bestFor: ["friends", "family"],
    budget: "cheap",
    setting: "outdoor",
    times: ["evening"],
    seasons: ["spring", "summer", "fall"],
  },
  {
    id: "distillery-tasting",
    title: "Distillery tasting flight",
    emoji: "🥃",
    category: "food_drink",
    summary:
      "A guided flight and a room that smells like oak — a grown-up, sit-down kind of date.",
    searchKeywords: ["distillery", "winery"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Milwaukee Distillery",
        href: "https://www.milwaukeedistillery.com/",
      },
    ],
  },
  {
    id: "pizza-crawl",
    title: "Neighborhood pizza crawl",
    emoji: "🍕",
    category: "food_drink",
    summary:
      "Two slices at three places. Everyone votes on the winner at the end.",
    searchKeywords: ["pizzeria", "restaurant"],
    bestFor: ["friends", "family"],
    budget: "cheap",
    setting: "indoor",
    times: ALL_TIMES,
    seasons: ALL_SEASONS,
  },
  {
    id: "dessert-walk",
    title: "Dessert and a walk",
    emoji: "🍦",
    category: "food_drink",
    summary:
      "Ice cream or a bakery stop, then a slow loop through a nearby neighborhood.",
    searchKeywords: ["ice cream shop", "bakery"],
    bestFor: ["date", "family"],
    budget: "cheap",
    setting: "either",
    times: ["afternoon", "evening"],
    seasons: ["spring", "summer", "fall"],
  },
  {
    id: "museum-day",
    title: "Museum afternoon",
    emoji: "🖼️",
    category: "arts_culture",
    summary:
      "Pick one wing instead of the whole building, then talk about the piece you liked most.",
    searchKeywords: ["museum", "art gallery"],
    bestFor: ["date", "family", "solo"],
    budget: "cheap",
    setting: "indoor",
    times: ["afternoon"],
    seasons: ALL_SEASONS,
    tip: "Many museums have free or reduced-admission days — check the official calendar.",
    officialLinks: [
      { label: "Milwaukee Art Museum", href: "https://mam.org/calendar/" },
      { label: "Milwaukee Public Museum", href: "https://www.mpm.edu/" },
    ],
  },
  {
    id: "paint-and-sip",
    title: "Paint-and-sip studio",
    emoji: "🎨",
    category: "arts_culture",
    summary:
      "Guided canvas painting with drinks and zero expectation of producing a masterpiece.",
    searchKeywords: ["art studio", "painting studio"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    tip: "Studios usually require reservations for scheduled sessions.",
  },
  {
    id: "theatre-night",
    title: "Local theatre night",
    emoji: "🎭",
    category: "arts_culture",
    summary:
      "Community and civic theatres put on real productions at a fraction of touring prices.",
    searchKeywords: ["theatre", "performing arts theater"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Waukesha Civic Theatre",
        href: "https://www.waukeshacivictheatre.org/box-office/upcoming-shows/",
      },
      { label: "Milwaukee Rep", href: "https://www.milwaukeerep.com/tickets/" },
    ],
  },
  {
    id: "architecture-walk",
    title: "Historic architecture walk",
    emoji: "🏛️",
    category: "arts_culture",
    summary:
      "Self-guided tour of the old downtown blocks, mansion district, or riverfront.",
    searchKeywords: ["historic site", "tourist attraction"],
    bestFor: ["date", "friends", "solo"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["spring", "summer", "fall"],
    officialLinks: [
      { label: "Pabst Mansion", href: "https://www.pabstmansion.com/" },
    ],
  },
  {
    id: "gallery-hop",
    title: "Gallery hop",
    emoji: "🖌️",
    category: "arts_culture",
    summary:
      "Independent galleries cluster downtown and often open late on weekend evenings.",
    searchKeywords: ["art gallery", "museum"],
    bestFor: ["date", "friends"],
    budget: "free",
    setting: "indoor",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "indie-film",
    title: "Indie film screening",
    emoji: "🎬",
    category: "arts_culture",
    summary:
      "Repertory and independent cinemas screen things the multiplex never will.",
    searchKeywords: ["cinema", "movie theater"],
    bestFor: ["date", "friends"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      { label: "Milwaukee Film", href: "https://www.milwaukeefilm.org/" },
    ],
  },
  {
    id: "library-author-talk",
    title: "Author talk at the library",
    emoji: "📚",
    category: "arts_culture",
    summary:
      "Free author visits, film screenings, and book clubs run all year at public libraries.",
    searchKeywords: ["library"],
    bestFor: ["date", "friends", "solo"],
    budget: "free",
    setting: "indoor",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Waukesha Public Library",
        href: "https://waukesha.librarycalendar.com/events/upcoming",
      },
    ],
  },
  {
    id: "open-mic",
    title: "Open mic or poetry night",
    emoji: "🎤",
    category: "arts_culture",
    summary:
      "Small rooms, brave performers, and a very cheap way to spend a Tuesday evening.",
    searchKeywords: ["cafe", "bar", "book store"],
    bestFor: ["friends", "date"],
    budget: "free",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "bowling",
    title: "Bowling night",
    emoji: "🎳",
    category: "games",
    summary:
      "Two games, terrible shoes, and a scoreboard that keeps the trash talk honest.",
    searchKeywords: ["bowling alley"],
    bestFor: ["friends", "date", "family"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "escape-room",
    title: "Escape room challenge",
    emoji: "🔐",
    category: "games",
    summary:
      "An hour of locked-room puzzles that shows you exactly how a group communicates.",
    searchKeywords: ["escape room", "amusement center"],
    bestFor: ["friends", "date"],
    budget: "splurge",
    setting: "indoor",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
    tip: "Most rooms need a reservation and a minimum group size.",
  },
  {
    id: "axe-throwing",
    title: "Axe throwing",
    emoji: "🪓",
    category: "games",
    summary: "Coached lanes, a target board, and instant feedback on your aim.",
    searchKeywords: ["axe throwing", "amusement center"],
    bestFor: ["friends", "date"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [{ label: "AXE MKE", href: "https://www.axemke.com/" }],
  },
  {
    id: "arcade-bar",
    title: "Arcade bar night",
    emoji: "🕹️",
    category: "games",
    summary:
      "Pinball, cabinets, and drinks — a low-pressure room where nobody has to be good at it.",
    searchKeywords: ["arcade", "bar"],
    bestFor: ["friends", "date"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "mini-golf",
    title: "Mini golf showdown",
    emoji: "⛳",
    category: "games",
    summary:
      "Eighteen holes of windmills, with a running score and a rematch clause.",
    searchKeywords: ["miniature golf", "golf course"],
    bestFor: ["date", "family"],
    budget: "cheap",
    setting: "outdoor",
    times: ["afternoon"],
    seasons: ["spring", "summer", "fall"],
  },
  {
    id: "board-game-cafe",
    title: "Board game café",
    emoji: "🎲",
    category: "games",
    summary:
      "A shelf of games, a table for two hours, and staff who can teach the rules.",
    searchKeywords: ["cafe", "game store"],
    bestFor: ["friends", "date", "family"],
    budget: "cheap",
    setting: "indoor",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "trivia-night",
    title: "Trivia night at a pub",
    emoji: "🧠",
    category: "games",
    summary:
      "Free to play at most bars, and a natural icebreaker for a group that just met.",
    searchKeywords: ["bar", "pub", "restaurant"],
    bestFor: ["friends", "date"],
    budget: "free",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    tip: "Team sizes are usually capped — arrive early to claim a table.",
  },
  {
    id: "go-karts",
    title: "Go-kart race",
    emoji: "🏎️",
    category: "games",
    summary:
      "Timed laps, bragging rights, and a leaderboard photo for the group chat.",
    searchKeywords: ["go-kart", "amusement park"],
    bestFor: ["friends", "family"],
    budget: "splurge",
    setting: "either",
    times: ["afternoon"],
    seasons: ALL_SEASONS,
  },
  {
    id: "karaoke",
    title: "Karaoke room",
    emoji: "🎙️",
    category: "music_nightlife",
    summary:
      "A private room means nobody has to be brave in front of strangers — until round three.",
    searchKeywords: ["karaoke", "bar"],
    bestFor: ["friends", "date"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "pool-darts",
    title: "Pool or darts night",
    emoji: "🎱",
    category: "games",
    summary:
      "Cheap table time, a jukebox, and a score to settle by the end of the night.",
    searchKeywords: ["billiards", "bar"],
    bestFor: ["friends", "date"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "live-music",
    title: "Live band at a small venue",
    emoji: "🎸",
    category: "music_nightlife",
    summary:
      "Local bills at 150-capacity rooms are cheap, loud, and a much better story than a playlist.",
    searchKeywords: ["live music venue", "music venue", "bar"],
    bestFor: ["date", "friends"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Pabst Theater Group",
        href: "https://www.pabsttheatergroup.com/events",
      },
      { label: "Shank Hall", href: "https://www.shankhall.com/" },
    ],
  },
  {
    id: "concert-hall",
    title: "Concert hall performance",
    emoji: "🎻",
    category: "music_nightlife",
    summary:
      "Orchestra, opera, or chamber music — dress up a little and sit still for two hours.",
    searchKeywords: ["concert hall", "performing arts theater"],
    bestFor: ["date"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      { label: "Milwaukee Symphony", href: "https://www.mso.org/" },
      { label: "Florentine Opera", href: "https://www.florentineopera.org/" },
    ],
  },
  {
    id: "jazz-club",
    title: "Jazz club set",
    emoji: "🎷",
    category: "music_nightlife",
    summary:
      "A small stage, a late set, and a room quiet enough to actually talk between songs.",
    searchKeywords: ["jazz club", "bar"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "social-dance",
    title: "Social dance night",
    emoji: "💃",
    category: "music_nightlife",
    summary:
      "Most dance studios run beginner-friendly socials where switching partners is the norm.",
    searchKeywords: ["dance studio", "nightclub"],
    bestFor: ["date", "friends"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    tip: "Look for an intro lesson in the first hour if you have never danced before.",
  },
  {
    id: "outdoor-concert",
    title: "Outdoor summer concert series",
    emoji: "🎪",
    category: "music_nightlife",
    summary:
      "Free park concerts with lawn chairs, a cooler, and a crowd that knows the words.",
    searchKeywords: ["park", "amphitheater"],
    bestFor: ["date", "family", "friends"],
    budget: "free",
    setting: "outdoor",
    times: ["evening"],
    seasons: ["summer"],
    officialLinks: [
      {
        label: "Downtown Waukesha events",
        href: "https://www.downtownwaukesha.com/calendar/",
      },
    ],
  },
  {
    id: "pickup-basketball",
    title: "Pickup basketball",
    emoji: "🏀",
    category: "fitness",
    summary:
      "Open runs at park courts and rec centers; show up, get picked, play a few games.",
    searchKeywords: ["basketball court", "gym"],
    bestFor: ["friends"],
    budget: "free",
    setting: "either",
    times: ["afternoon", "evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "climbing-gym",
    title: "Indoor climbing session",
    emoji: "🧗",
    category: "fitness",
    summary:
      "Bouldering needs no partner and no experience — just rental shoes and a little nerve.",
    searchKeywords: ["climbing gym", "gym"],
    bestFor: ["date", "friends"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    tip: "First-visit orientations vary by gym; call ahead for the intro class schedule.",
  },
  {
    id: "tennis-pickleball",
    title: "Tennis or pickleball match",
    emoji: "🎾",
    category: "fitness",
    summary:
      "Public courts are free, and pickleball has a much shorter learning curve than tennis.",
    searchKeywords: ["tennis court", "sports complex"],
    bestFor: ["friends", "date"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["spring", "summer", "fall"],
  },
  {
    id: "group-run",
    title: "Group run with a local club",
    emoji: "🏃",
    category: "fitness",
    summary:
      "Most running stores host free weekly runs with a slow group and a coffee stop after.",
    searchKeywords: ["park", "running track"],
    bestFor: ["friends", "solo"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "evening"],
    seasons: ALL_SEASONS,
  },
  {
    id: "public-pool",
    title: "Public pool swim",
    emoji: "🏊",
    category: "fitness",
    summary:
      "Lap swim, open swim, or a lazy afternoon float at a city or county aquatic center.",
    searchKeywords: ["swimming pool", "aquatic center"],
    bestFor: ["family", "friends"],
    budget: "cheap",
    setting: "either",
    times: ["afternoon"],
    seasons: ["summer"],
  },
  {
    id: "pro-game",
    title: "Cheer on a pro team",
    emoji: "🏟️",
    category: "fitness",
    summary:
      "Bucks, Brewers, Admirals, or a minor-league night out — the crowd does half the work.",
    searchKeywords: ["stadium", "arena"],
    bestFor: ["date", "friends", "family"],
    budget: "splurge",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Milwaukee Bucks tickets",
        href: "https://www.nba.com/bucks/tickets",
      },
      {
        label: "Milwaukee Brewers tickets",
        href: "https://www.mlb.com/brewers/tickets",
      },
    ],
  },
  {
    id: "volunteer-shift",
    title: "Volunteer shift together",
    emoji: "🤝",
    category: "community",
    summary:
      "Two hours at a food bank or park cleanup is a genuinely good second or third date.",
    searchKeywords: ["community center", "nonprofit"],
    bestFor: ["friends", "date", "solo"],
    budget: "free",
    setting: "either",
    times: ["morning", "afternoon"],
    seasons: ALL_SEASONS,
    tip: "Most organizations ask volunteers to register in advance and confirm age rules.",
    officialLinks: [
      {
        label: "Find a volunteer shift",
        href: "https://www.volunteermatch.org/search/?l=Milwaukee%2C+WI",
      },
    ],
  },
  {
    id: "community-class",
    title: "Community ed class",
    emoji: "🎓",
    category: "community",
    summary:
      "Short courses in everything from pottery to Spanish, usually a few evenings over a month.",
    searchKeywords: ["community center", "college"],
    bestFor: ["friends", "solo"],
    budget: "cheap",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "WCTC continuing education",
        href: "https://www.wctc.edu/events",
      },
    ],
  },
  {
    id: "campus-event",
    title: "College campus event",
    emoji: "🏫",
    category: "community",
    summary:
      "Public lectures, open rehearsals, and game nights at nearby campuses are usually free.",
    searchKeywords: ["college", "university"],
    bestFor: ["friends", "solo"],
    budget: "free",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      { label: "Marquette events", href: "https://www.marquette.edu/events/" },
    ],
  },
  {
    id: "club-meetup",
    title: "Join a local club meetup",
    emoji: "👋",
    category: "community",
    summary:
      "Book clubs, hiking groups, board game nights, and hobby meetups run every week in most towns.",
    searchKeywords: ["community center", "library"],
    bestFor: ["friends", "solo"],
    budget: "free",
    setting: "indoor",
    times: ["evening"],
    seasons: ALL_SEASONS,
    officialLinks: [
      {
        label: "Find a Meetup group",
        href: "https://www.meetup.com/find/?location=us--wi--Milwaukee&source=EVENTS",
      },
    ],
  },
  {
    id: "pumpkin-patch",
    title: "Pumpkin patch and corn maze",
    emoji: "🎃",
    category: "seasonal",
    summary:
      "Hayrides, a maze, and photos you will actually want — peak fall group activity.",
    searchKeywords: ["farm", "amusement park"],
    bestFor: ["family", "date", "friends"],
    budget: "cheap",
    setting: "outdoor",
    times: ["afternoon"],
    seasons: ["fall"],
  },
  {
    id: "holiday-lights",
    title: "Holiday light walk",
    emoji: "✨",
    category: "seasonal",
    summary:
      "Botanical gardens, zoos, and downtown squares light up for a few weeks each winter.",
    searchKeywords: ["park", "tourist attraction"],
    bestFor: ["family", "date"],
    budget: "cheap",
    setting: "outdoor",
    times: ["evening"],
    seasons: ["winter"],
  },
  {
    id: "county-fair",
    title: "County or state fair day",
    emoji: "🎡",
    category: "seasonal",
    summary:
      "Fried everything, a Ferris wheel, and livestock barns the kids will talk about for weeks.",
    searchKeywords: ["fairground", "amusement park"],
    bestFor: ["family", "friends"],
    budget: "cheap",
    setting: "outdoor",
    times: ["afternoon", "evening"],
    seasons: ["summer"],
    officialLinks: [
      { label: "Wisconsin State Fair", href: "https://wistatefair.com/" },
    ],
  },
  {
    id: "fall-colors",
    title: "Fall color drive or hike",
    emoji: "🍁",
    category: "seasonal",
    summary:
      "Pick a river road or ridge trail during peak color and stop for cider on the way back.",
    searchKeywords: ["park", "nature reserve"],
    bestFor: ["date", "family"],
    budget: "free",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["fall"],
    officialLinks: [
      {
        label: "Wisconsin fall color report",
        href: "https://www.travelwisconsin.com/fall-color-report",
      },
    ],
  },
  {
    id: "pick-your-own",
    title: "Pick-your-own farm",
    emoji: "🍓",
    category: "seasonal",
    summary:
      "Strawberries in June, apples in September, and a trunk full of whatever is ripe.",
    searchKeywords: ["farm", "orchard"],
    bestFor: ["family", "date"],
    budget: "cheap",
    setting: "outdoor",
    times: ["morning"],
    seasons: ["summer", "fall"],
    tip: "U-pick farms post daily readiness — call before you drive out.",
  },
  {
    id: "outdoor-movie",
    title: "Outdoor movie night",
    emoji: "🍿",
    category: "seasonal",
    summary:
      "Parks and downtowns screen free movies on inflatable screens through the summer.",
    searchKeywords: ["park", "amusement park"],
    bestFor: ["family", "date"],
    budget: "free",
    setting: "outdoor",
    times: ["evening"],
    seasons: ["summer"],
    officialLinks: [
      {
        label: "Downtown Waukesha events",
        href: "https://www.downtownwaukesha.com/calendar/",
      },
    ],
  },
  {
    id: "haunted-attraction",
    title: "Haunted house or ghost tour",
    emoji: "👻",
    category: "seasonal",
    summary:
      "October only, genuinely silly, and a reliable excuse to stand very close together.",
    searchKeywords: ["amusement park", "tourist attraction"],
    bestFor: ["friends", "date"],
    budget: "cheap",
    setting: "either",
    times: ["evening"],
    seasons: ["fall"],
  },
  {
    id: "amusement-park",
    title: "Amusement park day",
    emoji: "🎢",
    category: "seasonal",
    summary:
      "A full day, a shared plan for which coasters matter, and a lot of walking.",
    searchKeywords: ["amusement park", "theme park"],
    bestFor: ["family", "friends"],
    budget: "splurge",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["summer"],
    officialLinks: [
      {
        label: "Six Flags Great America",
        href: "https://www.sixflags.com/greatamerica",
      },
    ],
  },
  {
    id: "zoo-day",
    title: "Zoo day",
    emoji: "🦒",
    category: "seasonal",
    summary:
      "Go early, pick three exhibits, and leave before anyone gets tired.",
    searchKeywords: ["zoo", "aquarium"],
    bestFor: ["family", "date"],
    budget: "cheap",
    setting: "outdoor",
    times: ["morning", "afternoon"],
    seasons: ["spring", "summer", "fall"],
    officialLinks: [
      { label: "Milwaukee County Zoo", href: "https://www.milwaukeezoo.org/" },
      { label: "Racine Zoo", href: "https://www.racinezoo.org/" },
    ],
  },
];

export const ACTIVITY_IDEA_GROUPS: { id: ActivityIdeaGroup; label: string }[] =
  [
    { id: "date", label: "Date" },
    { id: "friends", label: "Friends" },
    { id: "family", label: "Family" },
    { id: "solo", label: "On my own" },
  ];

export const ACTIVITY_IDEA_BUDGETS: {
  id: ActivityIdeaBudget;
  label: string;
  hint: string;
}[] = [
  { id: "free", label: "Free", hint: "No ticket needed" },
  { id: "cheap", label: "Under $25", hint: "Per person, roughly" },
  { id: "splurge", label: "Splurge", hint: "Reserve ahead" },
];

export const ACTIVITY_IDEA_TIMES: { id: ActivityIdeaTime; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

export function seasonForMonth(month: number): ActivityIdeaSeason {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function getActivityIdeaById(id: string) {
  return ACTIVITY_IDEAS.find(idea => idea.id === id);
}

export type ActivityIdeaFilters = {
  category?: string;
  group?: ActivityIdeaGroup | "all";
  budget?: ActivityIdeaBudget | "all";
  setting?: ActivityIdeaSetting | "all";
  timeOfDay?: ActivityIdeaTime | "all";
  /** Zero-based month, so the hub can lean into the current season. */
  month?: number;
  query?: string;
};

function matchesSetting(
  idea: ActivityIdea,
  setting: ActivityIdeaSetting | "all"
) {
  if (setting === "all") return true;
  return idea.setting === setting || idea.setting === "either";
}

export function filterActivityIdeas(
  ideas: ActivityIdea[],
  filters: ActivityIdeaFilters = {}
): ActivityIdea[] {
  const category = filters.category ?? "all";
  const group = filters.group ?? "all";
  const budget = filters.budget ?? "all";
  const setting = filters.setting ?? "all";
  const timeOfDay = filters.timeOfDay ?? "all";
  const season =
    filters.month === undefined ? undefined : seasonForMonth(filters.month);
  const query = (filters.query ?? "").trim().toLowerCase();

  return ideas.filter(idea => {
    if (category !== "all" && idea.category !== category) return false;
    if (group !== "all" && !idea.bestFor.includes(group)) return false;
    if (budget !== "all" && idea.budget !== budget) return false;
    if (!matchesSetting(idea, setting)) return false;
    if (timeOfDay !== "all" && !idea.times.includes(timeOfDay)) return false;
    if (season && !idea.seasons.includes(season)) return false;
    if (query) {
      const haystack =
        `${idea.title} ${idea.summary} ${idea.category.replace(/_/g, " ")} ${idea.searchKeywords.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function groupActivityIdeasByCategory(ideas: ActivityIdea[]) {
  return ACTIVITY_IDEA_CATEGORIES.map(category => ({
    category,
    ideas: ideas.filter(idea => idea.category === category.id),
  })).filter(group => group.ideas.length > 0);
}

/**
 * Keeps every idea visible but floats the ones that suit the current season to the top of their group,
 * so the catalog stays complete while the timely plans are the first thing a member reads.
 */
export function sortIdeasForSeason(
  ideas: ActivityIdea[],
  now = new Date()
): ActivityIdea[] {
  const season = seasonForMonth(now.getMonth());
  const rank = (idea: ActivityIdea) => {
    if (idea.category === "seasonal")
      return idea.seasons.includes(season) ? 0 : 2;
    return idea.seasons.includes(season) ? 0 : 1;
  };
  return [...ideas].sort((a, b) => rank(a) - rank(b));
}

/** A handful of ideas that suit the current month, so the hub never opens on an empty page. */
export function pickSeasonalIdeas(now = new Date(), count = 4) {
  const season = seasonForMonth(now.getMonth());
  const inSeason = ACTIVITY_IDEAS.filter(idea => idea.seasons.includes(season));
  const picks = inSeason
    .filter(idea => idea.category !== "seasonal")
    .slice(0, count);
  return picks.length >= count
    ? picks
    : [
        ...picks,
        ...ACTIVITY_IDEAS.filter(idea => !picks.includes(idea)).slice(
          0,
          count - picks.length
        ),
      ];
}
