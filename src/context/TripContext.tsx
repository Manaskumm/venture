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

export interface Message {
  id: string;
  content: string;
  sender: "me" | "other";
}

export interface TravelerProfile {
  name: string;
  nationality: string;
  passports: string[];
  seatPreference: "window" | "aisle" | "extra-legroom";
  mealPreference: "none" | "vegetarian" | "vegan" | "gluten-free";
  accessibilityNeeds: string;
  loyaltyPrograms: { [key: string]: string };
  budgetTier: "budget" | "boutique" | "luxury";
  autonomyLevel: "manual" | "hybrid" | "autonomous";
}

export interface VentureNotification {
  id: string;
  type: "delay" | "weather" | "safety" | "price";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface TripContextType {
  tripData: TripData;
  setTripData: (data: TripData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  mapFocusQuery: string | null;
  setMapFocusQuery: (query: string | null) => void;
  initialMessage: string | null;
  setInitialMessage: (msg: string | null) => void;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  profile: TravelerProfile;
  setProfile: (profile: TravelerProfile) => void;
  notifications: VentureNotification[];
  setNotifications: (notifs: VentureNotification[]) => void;
}

const defaultProfile: TravelerProfile = {
  name: "Guest",
  nationality: "Not Set",
  passports: [],
  seatPreference: "window",
  mealPreference: "none",
  accessibilityNeeds: "",
  loyaltyPrograms: {},
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
  const [isLoading, setIsLoading] = useState(false);
  const [mapFocusQuery, setMapFocusQuery] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<TravelerProfile>(defaultProfile);
  const [notifications, setNotifications] = useState<VentureNotification[]>([]);

  return (
    <TripContext.Provider value={{ 
      tripData, 
      setTripData, 
      isLoading, 
      setIsLoading,
      mapFocusQuery,
      setMapFocusQuery,
      initialMessage,
      setInitialMessage,
      messages,
      setMessages,
      profile,
      setProfile,
      notifications,
      setNotifications
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
