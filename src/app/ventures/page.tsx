"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Calendar,
  ChevronLeft,
  DollarSign,
  ExternalLink,
  Compass,
  MapPin,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RayBackground } from "@/components/ui/ray-background";
import { useTrip } from "@/context/TripContext";
import type { DayPlan, TripData } from "@/context/TripContext";

type VentureSummary = {
  id: string;
  destination: string;
  duration: number;
  totalEstimatedCost: number;
  currencySymbol?: string | null;
  currencyCode?: string | null;
  mapQuery?: string | null;
  weatherSummary?: string | null;
  startDate?: string | null;
  itinerary?: DayPlan[] | null;
  createdAt: string;
};

function inferCurrency(venture: VentureSummary) {
  const text = `${venture.destination} ${venture.mapQuery || ""} ${
    venture.weatherSummary || ""
  } ${JSON.stringify(venture.itinerary || [])}`.toLowerCase();

  if (venture.currencySymbol || venture.currencyCode) {
    return {
      symbol: venture.currencySymbol || "",
      code: venture.currencyCode || "",
    };
  }

  if (
    text.includes("india") ||
    text.includes("inr") ||
    text.includes("rupee") ||
    text.includes("\u20b9")
  ) {
    return { symbol: "\u20b9", code: "INR" };
  }

  if (venture.totalEstimatedCost >= 1_000_000) {
    return { symbol: "\u20b9", code: "INR" };
  }

  return { symbol: "$", code: "USD" };
}

function formatVentureCost(venture: VentureSummary) {
  const currency = inferCurrency(venture);
  const amount = venture.totalEstimatedCost.toLocaleString();

  if (currency.symbol) {
    return `${currency.symbol}${amount}`;
  }

  return `${currency.code} ${amount}`.trim();
}

export default function VenturesPage() {
  const [ventures, setVentures] = useState<VentureSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { setTripData, setMapFocusQuery } = useTrip();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/ventures/list")
      .then((res) => res.json())
      .then((data) => {
        setVentures(Array.isArray(data) ? data : []);
        setIsLoading(false);
      });
  }, []);

  const openVenture = (venture: VentureSummary) => {
    const currency = inferCurrency(venture);
    const trip: TripData = {
      destination: venture.destination,
      duration: venture.duration,
      startDate: venture.startDate || undefined,
      totalEstimatedCost: venture.totalEstimatedCost,
      itinerary: venture.itinerary || [],
      mapQuery: venture.mapQuery || venture.destination,
      weatherSummary: venture.weatherSummary || undefined,
      currencySymbol: currency.symbol,
      currencyCode: currency.code,
    };

    setTripData(trip);
    setMapFocusQuery(null);
    window.sessionStorage.setItem("venture.openTrip", JSON.stringify(trip));
    router.push("/planner");
  };

  const deleteVenture = async (ventureId: string) => {
    if (deletingId) return;

    setDeletingId(ventureId);
    try {
      const response = await fetch(`/api/ventures/${ventureId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete venture.");
      }

      setVentures((current) =>
        current.filter((venture) => venture.id !== ventureId)
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative overflow-x-hidden">
      <RayBackground />

      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center mb-16">
          <div className="flex items-center gap-6">
            <Link
              href="/planner"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-5xl font-serif italic tracking-wide">
                My Ventures
              </h1>
              <p className="text-[#8a8a8f] text-[10px] mt-1 uppercase tracking-[0.3em] font-bold">
                The Archive of Journeys
              </p>
            </div>
          </div>
          <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "w-10 h-10 rounded-xl" },
              }}
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[400px] rounded-3xl bg-white/5 animate-pulse border border-white/5"
              />
            ))
          ) : ventures.length === 0 ? (
            <div className="col-span-full py-32 text-center rounded-3xl bg-[#1e1e22]/50 border border-white/5 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 text-zinc-600">
                <MapPin className="w-8 h-8" />
              </div>
              <p className="text-[#8a8a8f] font-bold uppercase tracking-[0.2em] text-sm">
                No ventures archived yet
              </p>
              <Link
                href="/planner"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1488fc] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
              >
                Start a Journey
              </Link>
            </div>
          ) : (
            ventures.map((venture, idx) => (
              <motion.div
                key={venture.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-3xl bg-[#1e1e22] ring-1 ring-white/[0.08] overflow-hidden hover:ring-blue-500/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="p-8 relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#1488fc]/10 text-[#1488fc] flex items-center justify-center shadow-inner">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-[#5a5a5f] uppercase tracking-widest leading-none mb-1">
                        Archived
                      </span>
                      <span className="block text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                        {new Date(venture.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-serif italic mb-4 tracking-tight group-hover:text-[#1488fc] transition-colors">
                    {venture.destination}
                  </h3>

                  <div className="space-y-4 my-8">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-[#8a8a8f] font-bold uppercase tracking-widest">
                          Duration
                        </span>
                      </div>
                      <span className="text-xs font-bold">
                        {venture.duration} Days
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-[#8a8a8f] font-bold uppercase tracking-widest">
                          Investment
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatVentureCost(venture)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex gap-4">
                    <button
                      onClick={() => openVenture(venture)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
                    >
                      Open Venture <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteVenture(venture.id)}
                      disabled={deletingId === venture.id}
                      className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-zinc-600 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Delete ${venture.destination}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
