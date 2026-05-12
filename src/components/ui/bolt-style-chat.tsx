"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  MessageCircle,
  SendHorizontal,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { GlobePolaroids } from "./cobe-globe-polaroids";

interface BoltChatProps {
  onSend?: (message: string) => void;
}

type ExampleTrip = {
  title: string;
  description: string;
  prompt: string;
};

type TripBasics = {
  origin: string;
  destination: string;
  dates: string;
  travelers: string;
  budget: string;
  pace: string;
  requests: string;
};

const emptyTrip: TripBasics = {
  origin: "",
  destination: "",
  dates: "",
  travelers: "",
  budget: "",
  pace: "Balanced",
  requests: "",
};

const paceOptions = ["Relaxed", "Balanced", "Packed"];

const ventureWords = [
  "venture",
  "رحلة", // Arabic
  "旅する", // Japanese
  "ταξίδι", // Greek
  "venture",
  "பயணம்", // Tamil
  "यात्रा", // Hindi
  "旅行", // Chinese
  "venture",
  "여행", // Korean
  "поездка", // Russian
  "เดินทาง", // Thai
];

const exampleTrips: ExampleTrip[] = [
  {
    title: "Japan food and culture",
    description: "Tokyo, Kyoto, Osaka, rail timing, hotels, omakase.",
    prompt:
      "Plan a 10-day Japan food and culture trip from New York for 2 adults in October. Budget is about $8,000 excluding international flights. Include Tokyo, Kyoto, and Osaka, with food neighborhoods, rail timing, hotels, luggage forwarding, one ryokan night, budget ranges, and backup options.",
  },
  {
    title: "Paris family trip",
    description: "Kid-friendly pacing, trains, hotels, rainy-day backups.",
    prompt:
      "Plan a relaxed 7-day family trip from Boston to Paris and the Loire Valley in June for 2 adults and 2 kids. Budget is $9,500 all-in. Include family rooms, museum pacing, playground breaks, train transfers, budget notes, and rainy-day backup plans.",
  },
  {
    title: "Dubai stopover",
    description: "Transfers, AED budget, dining, visa notes, desert time.",
    prompt:
      "Plan a packed 5-day Dubai stopover from London in February for 1 traveler. Budget is AED 12,000. Include fine dining, desert time, airport transfers, visa reminders, heat-safe timing, daily budget ranges, and risk notes.",
  },
];

export function BoltStyleChat({ onSend }: BoltChatProps) {
  const [manualPrompt, setManualPrompt] = useState("");
  const [showTripBasics, setShowTripBasics] = useState(false);
  const [trip, setTrip] = useState<TripBasics>(emptyTrip);
  const [wordIndex, setWordIndex] = useState(0);
  const [typedWord, setTypedWord] = useState(ventureWords[0]);
  const [isDeleting, setIsDeleting] = useState(true);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const currentWord = ventureWords[wordIndex];
    const delay = isDeleting ? 45 : 80;

    const timer = window.setTimeout(() => {
      if (isDeleting) {
        if (typedWord.length > 0) {
          setTypedWord((current) => current.slice(0, -1));
          return;
        }

        setWordIndex((current) => (current + 1) % ventureWords.length);
        setIsDeleting(false);
        return;
      }

      if (typedWord.length < currentWord.length) {
        setTypedWord(currentWord.slice(0, typedWord.length + 1));
        return;
      }

      window.setTimeout(() => setIsDeleting(true), 1100);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isDeleting, typedWord, wordIndex]);

  const fillExample = (example: ExampleTrip) => {
    setManualPrompt(example.prompt);
  };

  const updateTrip = (field: keyof TripBasics, value: string) => {
    setTrip((current) => ({ ...current, [field]: value }));
  };

  const hasTripBasics =
    trip.origin.trim() ||
    trip.destination.trim() ||
    trip.dates.trim() ||
    trip.travelers.trim() ||
    trip.budget.trim() ||
    trip.requests.trim();

  const buildPrompt = () => {
    const lines = [
      manualPrompt.trim(),
      hasTripBasics && "Trip basics:",
      trip.origin.trim() && `Origin: ${trip.origin.trim()}`,
      trip.destination.trim() && `Destination: ${trip.destination.trim()}`,
      trip.dates.trim() && `Dates or duration: ${trip.dates.trim()}`,
      trip.travelers.trim() && `Travelers: ${trip.travelers.trim()}`,
      trip.budget.trim() && `Budget: ${trip.budget.trim()}`,
      hasTripBasics && `Pace: ${trip.pace}`,
      trip.requests.trim() && `Special requests: ${trip.requests.trim()}`,
      "Include itinerary, stays, meals, transport, budget ranges, risk notes, assumptions, and backup options.",
    ].filter(Boolean);

    return lines.join("\n");
  };

  const canSubmit = manualPrompt.trim().length > 0 || Boolean(hasTripBasics);

  const submit = () => {
    if (!canSubmit) return;
    onSend?.(buildPrompt());
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(20,136,252,0.34),transparent_36%),linear-gradient(180deg,#09131f_0%,#080b10_55%,#070707_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#080b10] to-transparent" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-end px-5 py-6 md:px-8">
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/15">
              Sign In
            </button>
          </SignInButton>
        ) : (
          <UserButton
            appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }}
          />
        )}
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-start gap-8 px-5 pb-10 md:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(430px,0.72fr)]">
        <section className="relative min-h-[calc(100vh-112px)] py-2 lg:translate-y-8">
          <div className="pointer-events-none absolute -left-16 top-40 hidden h-[620px] w-[620px] opacity-95 lg:block">
            <GlobePolaroids className="h-full w-full" speed={0.0022} />
          </div>

          <div className="relative z-10 max-w-3xl -translate-y-3 lg:pt-2">
            <h1 className="flex max-w-4xl flex-col gap-y-2 text-4xl font-serif italic leading-[1.04] tracking-wide text-white sm:text-6xl lg:text-7xl">
              <span>Where will you</span>
              <span className="flex items-center gap-x-3">
                <span className="flex items-center bg-gradient-to-b from-[#74bbff] via-[#4da5fc] to-white bg-clip-text italic text-transparent">
                  {typedWord}
                  <span className="ml-1 inline-block h-[0.82em] w-[0.06em] translate-y-[0.08em] animate-[caret-blink_1s_step-end_infinite] bg-[#74bbff]" />
                </span>
                <span>today?</span>
              </span>
            </h1>
          </div>

          <div className="relative mx-auto mt-6 h-[320px] w-[320px] lg:hidden">
            <GlobePolaroids className="h-full w-full" speed={0.0022} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-[#121820]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
                Trip request
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Start with what you know
              </h2>
            </div>
            <MessageCircle className="h-5 w-5 text-white/35" />
          </div>

          <label className="block">
            <textarea
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
              placeholder="Tell Venture anything: where you want to go, dates, travelers, budget, pace, hotel style, food preferences, must-see places, mobility needs..."
              className="min-h-40 w-full resize-none rounded-[1.35rem] border border-white/12 bg-[#202832] px-4 py-4 text-sm leading-6 text-white shadow-inner shadow-black/30 outline-none transition placeholder:text-white/28 focus:border-blue-400/70 focus:bg-[#232d39]"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowTripBasics((current) => !current)}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left transition hover:border-blue-400/45 hover:bg-blue-500/10"
          >
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
              <SlidersHorizontal className="h-4 w-4 text-blue-200" />
              Customize trip basics
            </span>
            <ChevronDown
              className={`h-4 w-4 text-white/45 transition ${
                showTripBasics ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTripBasics ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/18 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TripInput
                  label="Origin"
                  value={trip.origin}
                  placeholder="New York"
                  onChange={(value) => updateTrip("origin", value)}
                />
                <TripInput
                  label="Destination"
                  value={trip.destination}
                  placeholder="Japan"
                  onChange={(value) => updateTrip("destination", value)}
                />
                <TripInput
                  label="Dates"
                  value={trip.dates}
                  placeholder="10 days in October"
                  onChange={(value) => updateTrip("dates", value)}
                />
                <TripInput
                  label="Travelers"
                  value={trip.travelers}
                  placeholder="2 adults"
                  onChange={(value) => updateTrip("travelers", value)}
                />
                <div className="sm:col-span-2">
                  <TripInput
                    label="Budget"
                    value={trip.budget}
                    placeholder="$8,000 excluding flights"
                    onChange={(value) => updateTrip("budget", value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  Pace
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {paceOptions.map((pace) => (
                    <button
                      key={pace}
                      onClick={() => updateTrip("pace", pace)}
                      className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                        trip.pace === pace
                          ? "border-blue-400/70 bg-blue-500 text-white"
                          : "border-white/10 bg-white/[0.07] text-white/55 hover:text-white"
                      }`}
                    >
                      {pace}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-3 block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  Special requests
                </span>
                <textarea
                  value={trip.requests}
                  onChange={(e) => updateTrip("requests", e.target.value)}
                  placeholder="Food preferences, hotel style, must-see places, mobility needs..."
                  className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-white/[0.07] px-3 py-3 text-sm leading-6 text-white placeholder-white/25 outline-none transition focus:border-blue-400/70"
                />
              </label>
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1488fc] text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(20,136,252,0.32)] transition hover:bg-[#1a94ff] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Plan Trip
            <SendHorizontal className="h-4 w-4" />
          </button>

          <div className="mt-5 grid gap-2">
            {exampleTrips.map((example) => (
              <button
                key={example.title}
                onClick={() => fillExample(example)}
                className="group rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left transition hover:border-blue-400/50 hover:bg-blue-500/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-white">
                      {example.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#aab2bf]">
                      {example.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/35 transition group-hover:text-blue-200" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3 text-[11px] leading-5 text-emerald-100">
            <WalletCards className="h-4 w-4 shrink-0" />
            Venture returns an editable itinerary, budget, and risk notes before
            you commit to bookings.
          </div>
        </section>
      </main>
    </div>
  );
}

function TripInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/45">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-blue-400/70"
      />
    </label>
  );
}
