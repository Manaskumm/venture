"use client";

import TimelineRail from "@/components/ui/timeline-rail";
import { useTrip } from "@/context/TripContext";
import type { TravelerProfile, TripData } from "@/context/TripContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { Bot, BriefcaseBusiness, CalendarDays, CloudSun, Compass, CreditCard, ExternalLink, Hotel, Loader2, MapPin, MessageSquare, Plane, SendHorizontal, Settings, ShieldCheck, Sparkles, Utensils, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BoltStyleChat } from "@/components/ui/bolt-style-chat";
import { AILoader } from "@/components/ui/ai-loader";
import { RayBackground } from "@/components/ui/ray-background";

type PlannerLayer = "chat" | "settings";
type VentureMessage = {
  role: "user" | "venture";
  content: string;
};

function LockedView({ title, description, icon: Icon }: { title: string, description: string, icon: LucideIcon }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
        <Icon className="w-10 h-10 text-zinc-600" />
      </div>
      <h2 className="text-4xl font-serif italic tracking-wide mb-4 text-white">{title}</h2>
      <p className="text-[#8a8a8f] text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed mb-12">{description}</p>
      
      <SignInButton mode="modal">
        <button className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-500/20">
          Unlock with Account
        </button>
      </SignInButton>
    </div>
  );
}

function SettingsInput({
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
      <span className="text-[10px] font-black uppercase tracking-widest text-[#8a8a8f]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/70 focus:bg-white/[0.08]"
      />
    </label>
  );
}

function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#8a8a8f]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-[#292930] px-4 text-sm text-white outline-none transition focus:border-blue-400/70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingsTextArea({
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
      <span className="text-[10px] font-black uppercase tracking-widest text-[#8a8a8f]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/70 focus:bg-white/[0.08]"
      />
    </label>
  );
}

function parseLocalDate(dateText: string) {
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }

  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function inferStartDate(tripData: TripData) {
  if (tripData.startDate) {
    const parsed = parseLocalDate(tripData.startDate);
    if (parsed) return parsed;
  }

  const firstDatedDay = tripData.itinerary.find((day) => day.date);
  if (firstDatedDay?.date) {
    const parsed = parseLocalDate(firstDatedDay.date);
    if (parsed) return parsed;
  }

  return new Date();
}

function getDayDate(tripData: TripData, dayNumber: number, dateText?: string) {
  if (dateText) {
    const parsed = parseLocalDate(dateText);
    if (parsed) return parsed;
  }

  return addDays(inferStartDate(tripData), Math.max(dayNumber - 1, 0));
}

function usesImperialWeather(tripData: TripData) {
  const placeText = `${tripData.destination} ${tripData.mapQuery} ${
    tripData.currencyCode || ""
  }`.toLowerCase();

  return [
    "united states",
    "usa",
    "u.s.",
    "america",
    "hawaii",
    "alaska",
    "puerto rico",
    "guam",
    "bahamas",
    "belize",
    "cayman",
    "liberia",
    "myanmar",
  ].some((token) => placeText.includes(token));
}


function WeatherBadge({ tripData, day }: { tripData: TripData, day?: TripData["itinerary"][number] }) {
  const weather = day?.weather;
  if (!weather) return <>{tripData.weatherSummary || "Weather estimate pending"}</>;

  const wantsImperial = usesImperialWeather(tripData);
  const tempF = weather.temperatureF ?? (typeof weather.temperatureC === "number" ? Math.round((weather.temperatureC * 9) / 5 + 32) : undefined);
  const tempC = weather.temperatureC ?? (typeof weather.temperatureF === "number" ? Math.round(((weather.temperatureF - 32) * 5) / 9) : undefined);

  const primaryTemp = wantsImperial ? (typeof tempF === "number" ? `${tempF}°F` : "") : (typeof tempC === "number" ? `${tempC}°C` : "");
  const altTemp = wantsImperial ? (typeof tempC === "number" ? `${tempC}°C` : "") : (typeof tempF === "number" ? `${tempF}°F` : "");

  const rain = typeof weather.precipitationChance === "number" ? `${weather.precipitationChance}% rain` : "";
  const baseText = [weather.summary, primaryTemp, rain].filter(Boolean).join(" · ");

  return (
    <span className="relative group cursor-help z-50">
      {baseText}
      {altTemp && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
          {altTemp}
        </span>
      )}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let fillPct = "0%";
    if (rating >= i) {
      fillPct = "100%";
    } else if (rating > i - 1) {
      fillPct = `${Math.round((rating - (i - 1)) * 100)}%`;
    }
    
    // We replace the dot with a dash to avoid invalid CSS IDs
    const gradientId = `star-grad-${i}-${rating.toString().replace('.', '-')}`;
    
    stars.push(
      <svg key={i} viewBox="0 0 24 24" className="w-3 h-3 drop-shadow-sm" style={{ minWidth: "12px" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset={fillPct} stopColor="#fbbf24" />
            <stop offset={fillPct} stopColor="#3f3f46" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${gradientId})`}
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    );
  }
  return <div className="flex items-center gap-[2px] ml-2" title={`${rating} stars`}>{stars}</div>;
}

export default function PlannerPage() {
  const { tripData, setTripData, mapFocusQuery, setMapFocusQuery, profile, setProfile } = useTrip();
  const router = useRouter();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const ventureScrollRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [isStarted, setIsStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<VentureMessage[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeLayer, setActiveLayer] = useState<PlannerLayer>("chat");
  const [isVentureOpen, setIsVentureOpen] = useState(false);
  const [ventureInput, setVentureInput] = useState("");
  const [ventureMessages, setVentureMessages] = useState<VentureMessage[]>([
    {
      role: "venture",
      content: "Hi, I'm Venture. How can I help you refine this trip?",
    },
  ]);
  const [isRefiningTrip, setIsRefiningTrip] = useState(false);
  const { isSignedIn } = useUser();

  const hasPlan = tripData.itinerary.length > 0 && tripData.itinerary[0].activities.length > 0;

  const returnToLanding = () => {
    setTripData({
      destination: "",
      duration: 0,
      totalEstimatedCost: 0,
      itinerary: [],
      mapQuery: "India",
    });
    setMapFocusQuery(null);
    setIsStarted(false);
    setActiveLayer("chat");
    setGenerationError(null);
    router.push("/");
  };

  useEffect(() => {
    const savedTrip = window.sessionStorage.getItem("venture.openTrip");
    if (!savedTrip) return;

    let timeoutId: number | undefined;

    try {
      const parsedTrip = JSON.parse(savedTrip) as TripData;
      if (parsedTrip.itinerary?.length) {
        timeoutId = window.setTimeout(() => {
          setTripData(parsedTrip);
          setMapFocusQuery(null);
          setIsStarted(true);
          setActiveLayer("chat");
          setSaveStatus("idle");
        }, 0);
      }
    } catch {
      // Ignore malformed archive handoff data.
    } finally {
      window.sessionStorage.removeItem("venture.openTrip");
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [setMapFocusQuery, setTripData]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (ventureScrollRef.current) {
      ventureScrollRef.current.scrollTop = ventureScrollRef.current.scrollHeight;
    }
  }, [ventureMessages, isRefiningTrip]);

  const extractTripData = (replyText: string): TripData | null => {
    const jsonMatch =
      replyText.match(/```json\n([\s\S]*?)\n```/) ||
      replyText.match(/```([\s\S]*?)```/) ||
      replyText.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse((jsonMatch[1] || jsonMatch[0]).trim()) as TripData;
    } catch (e) {
      console.error("Venture: Failed to parse itinerary JSON.", e);
      return null;
    }
  };

  const stripJsonBlock = (replyText: string) =>
    replyText
      .replace(/```json\n[\s\S]*?\n```/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/{[\s\S]*}$/g, "")
      .trim();

  const googleFlightsSearchUrl = (query: string) =>
    `https://www.google.com/travel/flights/search?q=${encodeURIComponent(query)}`;

  const shouldBuildItinerary = (message: string) => {
    const text = message.toLowerCase().trim();
    const hasExplicitGo =
      text.includes("plan it") ||
      text.includes("generate itinerary") ||
      text.includes("build my trip") ||
      text.includes("ready to plan") ||
      text.includes("show me the plan") ||
      text.includes("make the itinerary") ||
      text.includes("create the itinerary");

    const isConfirmation =
      text === "confirm" ||
      text === "yes" ||
      text === "yeah" ||
      text === "yep" ||
      text === "sure" ||
      text === "ok" ||
      text === "okay" ||
      text.includes("yes i am ready") ||
      text.includes("yes, i am ready") ||
      text.includes("sounds good") ||
      text.includes("looks good") ||
      text.includes("let's do it") ||
      text.includes("let's go") ||
      text.includes("proceed") ||
      text.includes("build it") ||
      text.includes("go ahead");

    if ((hasExplicitGo || isConfirmation) && chatHistory.length > 0) return true;

    const hasLabeledBasics = text.includes("trip basics:");
    const hasDestination = /destination:\s*\S+/.test(text);
    const hasTiming =
      /dates or duration:\s*\S+/.test(text) ||
      /\b(\d+)\s*(day|days|week|weeks)\b/.test(text) ||
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(text);
    const hasTravelers =
      /travelers:\s*\S+/.test(text) ||
      /\b(\d+)\s*(adult|adults|kid|kids|child|children|traveler|travelers|people|person|persons)\b/.test(text);
    const hasBudget =
      /budget:\s*\S+/.test(text) ||
      /(\$|usd|eur|gbp|inr|aed|cad|aud|yen|rupees|dollars|euros|pounds)/.test(text);
    const hasFreeformDestination =
      /\b(to|in|through|around)\s+[a-z][a-z\s,.-]{2,}/.test(text);

    if (hasLabeledBasics) {
      return hasDestination && hasTiming && hasTravelers;
    }

    return /^plan\b/.test(text) && hasFreeformDestination && hasTiming && hasTravelers && hasBudget;
  };

  const generatePlan = async (message: string) => {
    const shouldPlan = shouldBuildItinerary(message);
    const isFirstMessage = chatHistory.length === 0;
    const historyBackup = [...chatHistory];

    if (!isFirstMessage && !shouldPlan) {
      setChatHistory(prev => [...prev, { role: "user", content: message }]);
    } else if (shouldPlan) {
      setChatHistory([]);
    }

    setIsStarted(true);
    setActiveLayer("chat");
    setIsGenerating(true);
    setGenerationError(null);
    setMapFocusQuery(null);
    setActiveDay(1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: chatHistory.map(m => ({ content: m.content, sender: m.role === 'user' ? 'me' : 'other' })),
          profile,
          mode: shouldPlan ? "plan" : "discover",
        }),
      });

      const data: { reply?: string; error?: string } = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to generate this trip.");
      }

      const reply = data.reply || "";
      const parsedTrip = extractTripData(reply);
      
      if (!parsedTrip) {
        setChatHistory(prev => {
          if (isFirstMessage) {
            return [
              { role: "user", content: message },
              { role: "venture", content: reply }
            ];
          } else {
            return [
              ...prev,
              { role: "venture", content: reply }
            ];
          }
        });
        return;
      }

      setTripData(parsedTrip);
      setSaveStatus("idle");
      setChatHistory([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate this trip.";
      setGenerationError(message);
      if (shouldPlan) setChatHistory(historyBackup);
    } finally {
      setIsGenerating(false);
    }
  };

  const refineCurrentTrip = async () => {
    const request = ventureInput.trim();
    if (!request || isRefiningTrip) return;

    setVentureInput("");
    setVentureMessages((current) => [
      ...current,
      { role: "user", content: request },
    ]);
    setIsRefiningTrip(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: [
            "Modify the current itinerary based on the traveler request.",
            "Return a short natural-language summary first, then a complete updated JSON itinerary using the exact required schema.",
            "Keep good existing activities unless the request conflicts with them.",
            "If the traveler request names specific sights, landmarks, museums, restaurants, neighborhoods, experiences, venues, parks, beaches, hikes, monuments, or photo locations, include each named place as a scheduled itinerary activity unless impossible. Preserve the exact place name when practical, use a precise locationQuery, and explain any impossible fit in the summary.",
            "For flights, include route, carrier or carrier type, nonstop/connection notes, timing, cabin/seat assumptions, estimated fare, and a Google Flights search URL in bookingUrl. Do not claim prices are live; label them as estimates to verify on Google Flights.",
            "Keep or update startDate, each day.date, and each day.weather. Weather should be day-specific and use the destination's usual unit system: Fahrenheit for imperial/Fahrenheit destinations, Celsius for metric destinations.",
            "Preserve and apply traveler profile constraints including accessibility, mobility, dietary, seat, budget, and nationality needs. If accessibility needs are present, every relevant hotel, transport, restaurant, and attraction should explain why it fits or what must be verified.",
            `Traveler request: ${request}`,
            `Current itinerary JSON: ${JSON.stringify(tripData)}`,
          ].join("\n\n"),
          history: [],
          profile,
        }),
      });

      const data: { reply?: string; error?: string } = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to revise this trip.");
      }

      const reply = data.reply || "";
      const revisedTrip = extractTripData(reply);
      if (!revisedTrip) {
        throw new Error("Venture could not return a usable revised itinerary.");
      }

      setTripData(revisedTrip);
      setMapFocusQuery(null);
      setSaveStatus("idle");
      setVentureMessages((current) => [
        ...current,
        {
          role: "venture",
          content:
            stripJsonBlock(reply) ||
            "Done. I updated the itinerary with your requested changes.",
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to revise this trip.";
      setVentureMessages((current) => [
        ...current,
        { role: "venture", content: message },
      ]);
    } finally {
      setIsRefiningTrip(false);
    }
  };

  const saveCurrentTrip = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/ventures/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tripData, profile }),
      });

      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  };

  // Map trip data to timeline rail items
  const timelineItems = hasPlan 
    ? tripData.itinerary.map((day) => ({
        label: day.label,
        caption: `Day ${day.day} · ${formatMonthDay(
          getDayDate(tripData, day.day, day.date)
        )}`,
        active: day.day <= activeDay,
        onClick: () => {
          setActiveDay(day.day);
          setMapFocusQuery(null);
        }
      }))
    : [];

  const currentDayPlan = tripData.itinerary.find(d => d.day === activeDay) || tripData.itinerary[0];
  const allActivities = tripData.itinerary.flatMap((day) => day.activities);
  const flightActivities = allActivities.filter((activity) => activity.type === "flight");
  const tripStats = [
    { label: "Flights", value: flightActivities.length, icon: Plane },
    { label: "Stays", value: allActivities.filter((activity) => activity.type === "hotel").length, icon: Hotel },
    { label: "Dining", value: allActivities.filter((activity) => activity.type === "restaurant").length, icon: Utensils },
    { label: "Care", value: tripData.weatherSummary ? 1 : 0, icon: ShieldCheck },
  ];
  const activeDayCost = currentDayPlan?.activities.reduce((sum, activity) => sum + (Number(activity.estimatedCost) || 0), 0) || 0;
  const averageDailyCost = tripData.duration > 0 ? Math.round(tripData.totalEstimatedCost / tripData.duration) : 0;
  const totalFlightCost = flightActivities.reduce((sum, activity) => sum + (Number(activity.estimatedCost) || 0), 0);
  const timelineMinWidth = hasPlan
    ? Math.max(680, tripData.itinerary.length * 128)
    : 680;
  const currentDayDate = currentDayPlan
    ? getDayDate(tripData, currentDayPlan.day, currentDayPlan.date)
    : inferStartDate(tripData);


  // Map URL calculation
  const baseQuery = tripData.mapQuery || "India";
  const displayQuery = mapFocusQuery || baseQuery;
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(displayQuery)}`;
  const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  return (
    <div className="flex h-screen w-full bg-[#0f0f0f] text-white overflow-hidden font-sans relative">
      <RayBackground />

      {/* VENTURE OS SIDEBAR (North Star Architecture) */}
      <div className="w-16 flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50">
        <button
          onClick={returnToLanding}
          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 mb-4 transition hover:bg-blue-500 active:scale-95"
          aria-label="Back to landing page"
        >
          <Compass className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col gap-6 flex-1">
          {([
            { id: "chat", icon: MessageSquare, label: hasPlan ? "Venture" : "Intelligence" },
          ] satisfies { id: PlannerLayer; icon: LucideIcon; label: string }[]).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveLayer(item.id);
                if (hasPlan) setIsVentureOpen(true);
              }}
              className={`p-3 rounded-xl transition-all relative group ${activeLayer === item.id ? 'bg-white/10 text-blue-500' : 'text-zinc-600 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="absolute left-full ml-4 px-2 py-1 rounded bg-zinc-900 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}

          <Link
            href="/ventures"
            className="p-3 rounded-xl transition-all relative group text-zinc-600 hover:text-white hover:bg-white/10"
          >
            <BriefcaseBusiness className="w-5 h-5" />
            <span className="absolute left-full ml-4 px-2 py-1 rounded bg-zinc-900 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              My Ventures
            </span>
          </Link>
        </div>

        <button 
          onClick={() => setActiveLayer("settings")}
          className={`p-3 rounded-xl transition-all ${activeLayer === "settings" ? 'bg-white/10 text-blue-500' : 'text-zinc-600 hover:text-white'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isStarted && !hasPlan && activeLayer === 'chat' ? (
          /* PHASE 1: INITIAL ENTRY */
          <motion.div 
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 relative z-10"
          >
            <BoltStyleChat 
              onSend={generatePlan}
            />
          </motion.div>
        ) : (isGenerating || (!hasPlan && activeLayer === 'chat')) ? (
          /* PHASE 2: DIRECT PLAN GENERATION & DISCOVERY */
          <motion.div 
            key="discovery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center relative overflow-hidden z-10"
          >
            {isGenerating && chatHistory.length === 0 ? (
              <AILoader text="Planning" />
            ) : generationError ? (
              <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
                <div className="max-w-md rounded-3xl border border-red-500/20 bg-[#1e1e22] p-8 shadow-2xl shadow-black/40">
                  <Sparkles className="mx-auto mb-5 h-8 w-8 text-red-400" />
                  <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">Plan failed</h2>
                  <p className="mt-4 text-sm leading-6 text-[#a0a0a5]">{generationError}</p>
                  <button
                    onClick={() => {
                      setIsStarted(false);
                      setGenerationError(null);
                    }}
                    className="mt-7 rounded-xl bg-[#1488fc] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#1a94ff]"
                  >
                    Back to Chat
                  </button>
                </div>
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="flex flex-col h-full w-full px-6 py-10 relative z-20">
                 <div ref={chatScrollRef} className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pb-6 pr-2">
                    {chatHistory.map((msg, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] p-5 rounded-3xl ${msg.role === 'user' ? 'bg-[#1488fc] text-white shadow-xl shadow-blue-500/20' : 'bg-[#1e1e22]/90 backdrop-blur-md border border-white/10 text-zinc-200 shadow-xl'}`}>
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isGenerating && chatHistory.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] p-5 rounded-3xl bg-[#1e1e22]/90 backdrop-blur-md border border-white/10 text-zinc-200 shadow-xl flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                          <p className="text-[13px] leading-relaxed text-zinc-400 italic">Venture is thinking...</p>
                        </div>
                      </motion.div>
                    )}
                 </div>
                  <div className="mt-4 w-full flex gap-3 rounded-3xl border border-white/10 bg-[#1e1e22]/80 backdrop-blur-md p-2 shadow-2xl">
                    <textarea
                      placeholder="Reply to Venture..."
                      disabled={isGenerating}
                      className="min-h-[60px] flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (isGenerating) return;
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            generatePlan(val);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      disabled={isGenerating}
                      onClick={(e) => {
                        const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                        const val = textarea.value.trim();
                        if (val) {
                          generatePlan(val);
                          textarea.value = '';
                        }
                      }}
                      className="self-end rounded-2xl bg-[#1488fc] p-4 text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#1a94ff] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SendHorizontal className="h-5 w-5" />
                    </button>
                  </div>
              </div>
            ) : (
              <AILoader text="Planning" />
            )}
          </motion.div>
        ) : (
          /* PHASE 3: COMMAND CENTER (MODULAR) */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex h-full overflow-hidden relative z-10"
          >
            {/* VIEW: ITINERARY & INTELLIGENCE */}
            {activeLayer === "chat" && (
              <div className="flex-1 flex h-full overflow-hidden">
                {/* Trip summary sidebar */}
                <div className="w-[340px] flex-shrink-0 border-r border-white/5 p-6 bg-[#0f0f0f]/80 backdrop-blur-3xl flex flex-col shadow-2xl">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSignedIn ? (
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-lg" } }} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 shadow-inner">
                          <Compass className="w-4 h-4" />
                        </div>
                      )}
                      <h1 className="text-lg font-black tracking-[0.2em] text-white uppercase">Itinerary</h1>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 space-y-4 overflow-y-auto scrollbar-hide">
                    <div className="rounded-2xl border border-white/10 bg-[#1e1e22] p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5a5a5f]">Destination</p>
                      <h2 className="mt-2 text-3xl font-serif italic tracking-wide text-white">{tripData.destination}</h2>
                      <div className="mt-4 grid gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <CalendarDays className="h-4 w-4 text-blue-300" />
                          <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">Selected date</p>
                          <p className="mt-1 text-sm font-black text-white">{formatMonthDay(currentDayDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {tripStats.map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <stat.icon className="h-4 w-4 text-blue-400" />
                          <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                          <p className="mt-1 text-xl font-black text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5a5a5f]">Daily Average</p>
                      <p className="mt-2 text-xl font-black text-white">{tripData.currencySymbol || '$'}{averageDailyCost.toLocaleString()}</p>
                      <p className="mt-2 text-[11px] leading-5 text-[#8a8a8f]">Estimated across {tripData.duration || 0} planned days.</p>
                    </div>

                    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Flight Watch</p>
                          <p className="mt-2 text-xl font-black text-white">{tripData.currencySymbol || '$'}{totalFlightCost.toLocaleString()}</p>
                        </div>
                        <Plane className="h-5 w-5 text-blue-200" />
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-blue-100/80">Estimated fares. Verify and compare live prices on Google Flights before booking.</p>
                      <a
                        href={googleFlightsSearchUrl(`flights for ${tripData.destination}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/15"
                      >
                        Google Flights
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="mt-6 p-5 rounded-2xl bg-[#1e1e22] ring-1 ring-white/[0.08]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-[#5a5a5f] uppercase tracking-widest">Total Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{tripData.currencySymbol || '$'}{tripData.totalEstimatedCost.toLocaleString()}</p>
                    
                    {isSignedIn ? (
                      <button
                        disabled={saveStatus === "saving" || saveStatus === "saved"}
                        onClick={saveCurrentTrip}
                        className={`w-full mt-4 py-3 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${
                          saveStatus === "saved"
                            ? "bg-emerald-600 shadow-emerald-500/20"
                            : saveStatus === "error"
                              ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                              : "bg-[#1488fc] hover:bg-[#1a94ff] shadow-blue-500/20"
                        }`}
                      >
                        {saveStatus === "saving"
                          ? "Archiving..."
                          : saveStatus === "saved"
                            ? "Venture Saved"
                            : saveStatus === "error"
                              ? "Save Error"
                              : "Save Venture"}
                      </button>
                    ) : (
                      <SignInButton mode="modal">
                        <button className="w-full mt-4 py-3 rounded-xl bg-[#1488fc] hover:bg-[#1a94ff] text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">Save Venture</button>
                      </SignInButton>
                    )}
                  </div>
                </div>

                {/* Main Content (Map + Schedule) */}
                <div className="flex-1 flex flex-col h-full bg-[#0f0f0f]/40 backdrop-blur-sm">
                  <div className="min-h-44 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-3xl flex flex-col justify-center px-10 py-5 shadow-sm overflow-x-auto scrollbar-hide">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h2 className="text-xs font-bold text-[#1488fc] uppercase tracking-[0.3em] mb-1">Adventure to</h2>
                        <h3 className="text-5xl font-serif italic tracking-wide">{tripData.destination}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                          <CloudSun className="h-3 w-3" />
                          <WeatherBadge tripData={tripData} day={currentDayPlan} />
                        </span>
                        <span className="text-[10px] font-bold px-3 py-1.5 bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                          <CalendarDays className="h-3 w-3" />
                          {formatMonthDay(currentDayDate)}
                        </span>
                        <span className="text-[10px] font-bold px-3 py-1.5 bg-white/5 border border-white/10 rounded-full tracking-widest uppercase">{tripData.duration} DAYS</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 min-w-[680px]">
                      {tripStats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
                          <stat.icon className="w-4 h-4 text-blue-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</span>
                          <span className="ml-auto text-xs font-black text-white">{stat.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Daily avg</span>
                        <span className="ml-auto text-xs font-black text-white">{tripData.currencySymbol || '$'}{averageDailyCost.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="relative -mx-2 overflow-x-auto px-2 pb-2 scrollbar-hide">
                      <TimelineRail
                        items={timelineItems}
                        labelAngle={0}
                        size="md"
                        gapClassName="gap-0"
                        className="min-w-max overflow-visible px-0"
                        railClassName="left-6 right-6"
                        itemClassName="w-32 shrink-0"
                        labelClassName="max-w-28 overflow-hidden text-ellipsis text-center text-[11px]"
                        captionClassName="text-[11px]"
                        contentStyle={{ minWidth: timelineMinWidth }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
                    <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2 pb-28">
                      {!currentDayPlan ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-40">
                          <Sparkles className="w-8 h-8 mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Intelligence</p>
                          <p className="text-[9px] mt-1">Complete your discovery chat to build this view.</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-[10px] font-bold flex items-center gap-3 text-[#5a5a5f] uppercase tracking-[0.2em]"><span className="w-8 h-8 rounded-xl bg-[#1488fc]/10 text-[#1488fc] flex items-center justify-center text-xs font-black shadow-inner">{activeDay}</span><span>{currentDayPlan.label}</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] text-blue-200">{formatMonthDay(currentDayDate)}</span></h4>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{tripData.currencySymbol || '$'}{activeDayCost.toLocaleString()}</span>
                            </div>
                          </div>
                          {currentDayPlan.activities.map((activity, idx) => {
                            const detailsUrl = activity.bookingUrl || (activity.type === "flight" ? googleFlightsSearchUrl(`${activity.name} ${tripData.destination}`) : "");

                            return (
                            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => setMapFocusQuery(activity.locationQuery)} className={`cursor-pointer group min-h-fit p-5 rounded-2xl border transition-all duration-300 relative overflow-visible ${mapFocusQuery === activity.locationQuery ? 'bg-[#1488fc] text-white border-transparent shadow-2xl shadow-blue-500/40 scale-[1.02]' : 'bg-[#1e1e22] border-white/5 hover:border-[#1488fc]/50 hover:bg-[#25252a]'}`}>
                              {mapFocusQuery === activity.locationQuery && <div className="absolute top-0 right-0 p-2 opacity-50"><MapPin className="w-4 h-4" /></div>}
                              <div className="flex justify-between items-start mb-3"><span className={`text-[9px] font-bold uppercase tracking-widest ${mapFocusQuery === activity.locationQuery ? 'text-blue-100' : 'text-[#1488fc]'}`}>{activity.time}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${mapFocusQuery === activity.locationQuery ? 'bg-white/20' : 'bg-white/5 text-[#8a8a8f]'}`}>{activity.type}</span></div>
                              <h5 className="font-bold text-sm tracking-tight flex items-center">
                                {activity.name}
                                {typeof activity.rating === "number" && <StarRating rating={activity.rating} />}
                              </h5>
                              <p className={`text-[11px] mt-2 leading-relaxed ${mapFocusQuery === activity.locationQuery ? 'text-blue-50/80' : 'text-[#8a8a8f]'}`}>{activity.description}</p>
                              {activity.type === "flight" && (
                                <div className={`mt-3 rounded-xl border px-3 py-2 text-[10px] leading-5 ${mapFocusQuery === activity.locationQuery ? 'border-white/15 bg-white/10 text-blue-50' : 'border-blue-400/20 bg-blue-500/10 text-blue-100'}`}>
                                  Fare estimate. Compare live route prices on Google Flights before booking.
                                </div>
                              )}
                              <div className={`mt-5 pt-3 border-t flex justify-between items-center ${mapFocusQuery === activity.locationQuery ? 'border-white/10' : 'border-white/5'}`}><span className="text-xs font-black">{tripData.currencySymbol || '$'}{activity.estimatedCost}</span><div className="flex gap-4">{detailsUrl && <a href={detailsUrl} target="_blank" rel="noopener noreferrer" className={`text-[9px] font-bold uppercase tracking-widest border-b ${mapFocusQuery === activity.locationQuery ? 'text-white border-white/40' : 'text-[#1488fc] border-[#1488fc]/40'}`} onClick={(e) => e.stopPropagation()}>{activity.type === "flight" ? "Flights" : "Details"}</a>}<button className="text-[9px] font-bold uppercase tracking-widest opacity-60 border-b border-transparent hover:opacity-100" onClick={(e) => { e.stopPropagation(); setMapFocusQuery(activity.locationQuery); }}>Map</button></div></div>
                            </motion.div>
                          )})}
                        </>
                      )}
                    </div>
                    <div className="flex-1 rounded-3xl overflow-hidden ring-1 ring-white/[0.08] shadow-2xl relative bg-[#1e1e22] min-h-[360px]">
                      {hasMapsKey ? (
                        <iframe title="Trip map" width="100%" height="100%" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(110%) brightness(95%)' }} loading="lazy" allowFullScreen src={mapUrl}></iframe>
                      ) : (
                        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-10">
                          <MapPin className="w-12 h-12 text-blue-500 mb-5" />
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white mb-2">{displayQuery}</p>
                          <p className="max-w-sm text-[11px] leading-relaxed text-[#8a8a8f]">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the embedded operating map. Location focus still updates as you select itinerary items.</p>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayQuery)}`} target="_blank" rel="noopener noreferrer" className="mt-6 rounded-full bg-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/15">Open Maps</a>
                        </div>
                      )}
                      <div className="absolute inset-0 pointer-events-none border-[12px] border-[#0f0f0f] rounded-3xl" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: SETTINGS (AUTONOMY) */}
            {activeLayer === "settings" && (
              !isSignedIn ? (
                <LockedView title="Agent Intelligence" description="Autonomy thresholds and custom trust-dial settings are encrypted within your secure intelligence profile." icon={Settings} />
              ) : (
                <div className="flex-1 p-12 overflow-y-auto scrollbar-hide">
                  <div className="max-w-4xl">
                    <h1 className="text-5xl font-serif italic tracking-wide mb-4">Account Settings</h1>
                    <p className="text-[#8a8a8f] text-xs font-bold uppercase tracking-[0.3em] mb-10">Set the default traveler details Venture should remember while planning</p>
                    
                    <div className="mb-8 p-8 rounded-3xl bg-[#1e1e22] ring-1 ring-white/[0.08] shadow-2xl">
                      <div className="mb-8 flex items-start justify-between gap-6">
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Traveler Profile</h2>
                          <p className="text-[11px] leading-6 text-[#8a8a8f]">These defaults are sent with trip requests so Venture can avoid asking for the same details every time.</p>
                        </div>
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 rounded-xl" } }} />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <SettingsInput
                          label="Display name"
                          value={profile.name}
                          placeholder="Guest"
                          onChange={(value) => setProfile({ ...profile, name: value })}
                        />
                        <SettingsInput
                          label="Nationality"
                          value={profile.nationality}
                          placeholder="United States"
                          onChange={(value) => setProfile({ ...profile, nationality: value })}
                        />
                        <SettingsInput
                          label="Passports"
                          value={profile.passports.join(", ")}
                          placeholder="US, India, UK"
                          onChange={(value) =>
                            setProfile({
                              ...profile,
                              passports: value
                                .split(",")
                                .map((passport) => passport.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                        <SettingsSelect
                          label="Seat preference"
                          value={profile.seatPreference}
                          options={[
                            { value: "window", label: "Window" },
                            { value: "aisle", label: "Aisle" },
                            { value: "extra-legroom", label: "Extra legroom" },
                          ]}
                          onChange={(value) =>
                            setProfile({
                              ...profile,
                              seatPreference:
                                value as TravelerProfile["seatPreference"],
                            })
                          }
                        />
                        <SettingsSelect
                          label="Meal preference"
                          value={profile.mealPreference}
                          options={[
                            { value: "none", label: "No default" },
                            { value: "vegetarian", label: "Vegetarian" },
                            { value: "vegan", label: "Vegan" },
                            { value: "gluten-free", label: "Gluten-free" },
                          ]}
                          onChange={(value) =>
                            setProfile({
                              ...profile,
                              mealPreference:
                                value as TravelerProfile["mealPreference"],
                            })
                          }
                        />
                        <SettingsSelect
                          label="Budget style"
                          value={profile.budgetTier}
                          options={[
                            { value: "budget", label: "Budget" },
                            { value: "boutique", label: "Boutique" },
                            { value: "luxury", label: "Luxury" },
                          ]}
                          onChange={(value) =>
                            setProfile({
                              ...profile,
                              budgetTier: value as TravelerProfile["budgetTier"],
                            })
                          }
                        />
                        <div className="md:col-span-2">
                          <SettingsTextArea
                            label="Accessibility and mobility"
                            value={profile.accessibilityNeeds}
                            placeholder="Wheelchair user, limited walking, stroller access, sensory-friendly spaces, elevator access, accessible bathrooms..."
                            onChange={(value) =>
                              setProfile({
                                ...profile,
                                accessibilityNeeds: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-10 rounded-3xl bg-[#1e1e22] ring-1 ring-white/[0.08] shadow-2xl">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Autonomy Dial</h2>
                          <p className="text-[10px] text-[#8a8a8f] font-bold uppercase tracking-widest">Current Mode: {profile.autonomyLevel}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${profile.autonomyLevel === 'autonomous' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/5 text-zinc-700'}`}>
                          <Sparkles className="w-6 h-6" />
                        </div>
                      </div>

                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="1" 
                        value={profile.autonomyLevel === 'manual' ? 0 : profile.autonomyLevel === 'hybrid' ? 1 : 2} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProfile({...profile, autonomyLevel: val === 0 ? 'manual' : val === 1 ? 'hybrid' : 'autonomous'});
                        }} 
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-6" 
                      />
                      
                      <div className="grid grid-cols-3 text-center">
                        <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${profile.autonomyLevel === 'manual' ? 'text-white' : 'text-zinc-600'}`}>Manual Approval</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${profile.autonomyLevel === 'hybrid' ? 'text-white' : 'text-zinc-600'}`}>Hybrid</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${profile.autonomyLevel === 'autonomous' ? 'text-white' : 'text-zinc-600'}`}>Full Autonomy</div>
                      </div>

                      <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Auto-rebook delays</span>
                          <div className={`w-8 h-4 rounded-full relative ${profile.autonomyLevel === 'autonomous' ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${profile.autonomyLevel === 'autonomous' ? 'right-1' : 'left-1'}`} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Seat selection</span>
                          <div className={`w-8 h-4 rounded-full relative ${profile.autonomyLevel !== 'manual' ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${profile.autonomyLevel !== 'manual' ? 'right-1' : 'left-1'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hasPlan && (
        <>
          <button
            onClick={() => setIsVentureOpen(true)}
            className="absolute bottom-6 right-6 z-[70] inline-flex items-center gap-3 rounded-full border border-blue-300/30 bg-[#1488fc] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-blue-500/30 transition hover:bg-[#1a94ff]"
          >
            <Bot className="h-4 w-4" />
            Venture
          </button>

          <AnimatePresence>
            {isVentureOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[80] flex bg-black/35 backdrop-blur-sm"
                onClick={() => setIsVentureOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 28, stiffness: 260 }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full h-full bg-[#151a22] shadow-2xl flex flex-col"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500 text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-white">Venture</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Trip editor</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsVentureOpen(false)}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div ref={ventureScrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scrollbar-hide">
                    {ventureMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            message.role === "user"
                              ? "bg-[#1488fc] text-white"
                              : "border border-white/10 bg-white/[0.06] text-[#d8dde6]"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isRefiningTrip && (
                      <div className="flex justify-start">
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-[#d8dde6]">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                          Updating your plan...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <div className="flex gap-3 rounded-2xl border border-white/12 bg-[#202832] p-2">
                      <textarea
                        value={ventureInput}
                        onChange={(event) => setVentureInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            refineCurrentTrip();
                          }
                        }}
                        placeholder="Ask Venture to change hotels, add cheaper flights, slow the pace, swap activities, or compare routes..."
                        className="min-h-14 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/30"
                      />
                      <button
                        onClick={refineCurrentTrip}
                        disabled={!ventureInput.trim() || isRefiningTrip}
                        className="self-end rounded-xl bg-[#1488fc] p-3 text-white transition hover:bg-[#1a94ff] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isRefiningTrip ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SendHorizontal className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-white/35">
                      Flight prices are estimates here. Venture links you to Google Flights so you can verify live fares before booking.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
