"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Activity {
  time: string;
  name: string;
  description: string;
  type: "hotel" | "restaurant" | "attraction" | "flight" | "transport" | "other";
  locationQuery: string;
  estimatedCost: number;
  bookingUrl?: string;
  rating?: number;
}

export interface DayPlan {
  day: number;
  label: string;
  date?: string;
  weather?: {
    summary: string;
    temperatureC?: number;
    temperatureF?: number;
    precipitationChance?: number;
  };
  activities: Activity[];
}

export interface TripData {
  destination: string;
  duration: number;
  startDate?: string;
  totalEstimatedCost: number;
  itinerary: DayPlan[];
  mapQuery: string;
  weatherSummary?: string;
  currencySymbol?: string;
  currencyCode?: string;
}

export interface TravelerProfile {
  name: string;
  nationality: string;
  passports: string[];
  seatPreference: "window" | "aisle" | "extra-legroom";
  mealPreference: "none" | "vegetarian" | "vegan" | "gluten-free";
  accessibilityNeeds: string;
  budgetTier: "budget" | "boutique" | "luxury";
  autonomyLevel: "manual" | "hybrid" | "autonomous";
}

interface TripContextType {
  tripData: TripData;
  setTripData: (data: TripData) => void;
  mapFocusQuery: string | null;
  setMapFocusQuery: (query: string | null) => void;
  profile: TravelerProfile;
  setProfile: (profile: TravelerProfile) => void;
}

const defaultProfile: TravelerProfile = {
  name: "Guest",
  nationality: "Not Set",
  passports: [],
  seatPreference: "window",
  mealPreference: "none",
  accessibilityNeeds: "",
  budgetTier: "boutique",
  autonomyLevel: "hybrid",
};

const defaultTripData: TripData = {
  destination: "",
  duration: 0,
  totalEstimatedCost: 0,
  itinerary: [],
  mapQuery: "India",
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [tripData, setTripData] = useState<TripData>(defaultTripData);
  const [mapFocusQuery, setMapFocusQuery] = useState<string | null>(null);
  const [profile, setProfile] = useState<TravelerProfile>(defaultProfile);

  return (
    <TripContext.Provider value={{ 
      tripData, 
      setTripData, 
      mapFocusQuery,
      setMapFocusQuery,
      profile,
      setProfile,
    }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
