"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2, Navigation, X } from "lucide-react";

/* ──────────────────────────────────────────────────────
   Nominatim (OpenStreetMap) address search component,
   tuned for Kenyan addresses.
   ────────────────────────────────────────────────────── */

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    building?: string;
    house_number?: string;
  };
}

export interface AddressResult {
  /** Formatted, human-readable address string */
  displayName: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Area / Estate / Neighbourhood */
  area: string;
  /** Road or street name */
  road: string;
  /** City or town */
  city: string;
  /** County */
  county: string;
}

interface AddressSearchProps {
  /** Current address value */
  value: string;
  /** Called when user selects an address */
  onSelect: (result: AddressResult) => void;
  /** Called when text input changes (for manual entry) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
}

/**
 * Format a Nominatim result into a Kenya-friendly address string.
 * Prioritizes: Building → Road → Area/Estate → City
 */
function formatKenyanAddress(result: NominatimResult): AddressResult {
  const addr = result.address;

  const area =
    addr.suburb || addr.neighbourhood || "";
  const road = addr.road || "";
  const city = addr.city || addr.town || addr.county || "";
  const county = addr.county || addr.state || "";

  // Build a readable display name from components
  const parts: string[] = [];
  if (addr.building || addr.house_number) {
    parts.push(addr.building || addr.house_number || "");
  }
  if (road) parts.push(road);
  if (area) parts.push(area);
  if (city && city !== area) parts.push(city);
  if (county && county !== city) parts.push(county);

  const displayName = parts.length > 0 ? parts.join(", ") : result.display_name;

  return {
    displayName,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    area,
    road,
    city,
    county,
  };
}

/**
 * Reverse-geocode coordinates into a Kenya-friendly address.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<AddressResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      {
        headers: {
          "User-Agent": "ZingHealthyEats/1.0",
        },
      }
    );
    if (!response.ok) return null;
    const data: NominatimResult = await response.json();
    return formatKenyanAddress(data);
  } catch {
    return null;
  }
}

export default function AddressSearch({
  value,
  onSelect,
  onChange,
  placeholder = "Search for an area, road, or landmark...",
  disabled = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [locating, setLocating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Kenya"
        )}&addressdetails=1&limit=6&accept-language=en&countrycodes=ke`,
        {
          headers: {
            "User-Agent": "ZingHealthyEats/1.0",
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data: NominatimResult[] = await response.json();
      const formatted = data.map(formatKenyanAddress);
      setResults(formatted);
      setIsOpen(formatted.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    // Debounce API calls (500ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAddresses(val);
    }, 500);
  };

  const handleSelect = (result: AddressResult) => {
    setQuery(result.displayName);
    setIsOpen(false);
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        if (result) {
          setQuery(result.displayName);
          onSelect(result);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-11 pl-9 pr-20 rounded-xl border border-slate-200 bg-white text-sm
                     placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-brand-mustard/50 focus:border-brand-mustard
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating || disabled}
            className="p-1.5 rounded-lg bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue transition-colors disabled:opacity-50"
            title="Use my location"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Navigation className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="p-1.5 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lng}-${index}`}
                type="button"
                onClick={() => handleSelect(result)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                  index === activeIndex
                    ? "bg-brand-mustard/10 text-brand-blue"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-mustard" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {result.area || result.road || result.displayName.split(",")[0]}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {result.displayName}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 text-center">
              Powered by OpenStreetMap
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
