import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Heart, Sparkles, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { AdvisorAvatar } from "@/components/AdvisorAvatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIGNS = [
  ["aries", "Aries", "♈"], ["taurus", "Taurus", "♉"], ["gemini", "Gemini", "♊"],
  ["cancer", "Cancer", "♋"], ["leo", "Leo", "♌"], ["virgo", "Virgo", "♍"],
  ["libra", "Libra", "♎"], ["scorpio", "Scorpio", "♏"], ["sagittarius", "Sagittarius", "♐"],
  ["capricorn", "Capricorn", "♑"], ["aquarius", "Aquarius", "♒"], ["pisces", "Pisces", "♓"],
] as const;

const READINGS = [
  {
    opening: "A small invitation may turn into the best part of your day.",
    advice: "Say yes to one low-pressure, public activity that lets you be around good people without needing to perform.",
    nudge: "Bring your curiosity, and leave a little room for a pleasant surprise.",
  },
  {
    opening: "Today has a steady, neighborly kind of energy.",
    advice: "Sally’s advice is to choose something familiar—a favorite coffee shop, walking path, library, or community gathering—and notice who makes the place feel welcoming.",
    nudge: "Comfort is not boring when it helps you feel more like yourself.",
  },
  {
    opening: "Your best connection today may begin with an ordinary question.",
    advice: "Ask someone what they are looking forward to this week, then really listen to the answer.",
    nudge: "You do not have to be dazzling. Being genuinely interested is plenty.",
  },
  {
    opening: "A change of scenery could freshen your whole outlook.",
    advice: "Look for a current local event, class, game, or music night that feels easy to attend and gives you a natural reason to show up.",
    nudge: "Pick the option that feels inviting, not the one that looks impressive.",
  },
  {
    opening: "There is something useful hiding in a slower start.",
    advice: "Give yourself ten quiet minutes before deciding what the day needs from you. Then choose one kind, practical next step.",
    nudge: "A calm decision is still progress.",
  },
];

function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export default function Horoscope() {
  const [, navigate] = useLocation();
  const [sign, setSign] = useState(() => localStorage.getItem("just-putzit-horoscope-sign") || "libra");
  const today = useMemo(() => new Date(), []);
  const signInfo = SIGNS.find(([id]) => id === sign) ?? SIGNS[6];
  const reading = READINGS[(dayNumber(today) + signInfo[0].length) % READINGS.length];
  const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  function chooseSign(value: string) {
    setSign(value);
    localStorage.setItem("just-putzit-horoscope-sign", value);
  }

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-5 gap-2 rounded-full text-muted-foreground" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>

        <main className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <section className="relative bg-gradient-to-br from-amber-50 via-rose-50 to-violet-100 px-6 py-8 sm:px-10">
            <div className="absolute right-6 top-6 text-4xl opacity-40" aria-hidden="true">✦</div>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
              <AdvisorAvatar size="lg" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  <Sparkles className="h-3.5 w-3.5" /> Sally’s daily horoscope
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">A little guidance for today</h1>
                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start"><CalendarDays className="h-4 w-4" /> {dateLabel}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 p-6 sm:p-10">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your sign</p>
                <Select value={sign} onValueChange={chooseSign}>
                  <SelectTrigger aria-label="Choose your zodiac sign" className="h-12 rounded-xl bg-white text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIGNS.map(([id, label, symbol]) => <SelectItem key={id} value={id}>{symbol} {label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-3 text-orange-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl">{signInfo[2]}</div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Today’s sign</p><p className="font-bold">{signInfo[1]}</p></div>
              </div>
            </div>

            <article className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50 p-6 sm:p-8">
              <p className="text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">“{reading.opening}”</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/80 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-700"><Heart className="h-4 w-4 fill-current" /> Sally’s advice</div><p className="text-sm leading-relaxed text-muted-foreground">{reading.advice}</p></div>
                <div className="rounded-2xl bg-white/80 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700"><Sun className="h-4 w-4" /> Your gentle nudge</div><p className="text-sm leading-relaxed text-muted-foreground">{reading.nudge}</p></div>
              </div>
            </article>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-center text-xs leading-relaxed text-sky-900">
              Sally’s horoscopes are for entertainment and reflection only. They are not predictions, medical advice, financial advice, or a substitute for your own judgment.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
