"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Globe2 } from "lucide-react";
import type { GlobeProps } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-navy-deep text-silver-muted text-sm">
      جاري تحميل الكرة الأرضية…
    </div>
  ),
});

const GLOBE_NIGHT_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-night.jpg";

type Category =
  | "hq"
  | "founding_partner"
  | "exclusive_sovereign"
  | "exclusive_agent"
  | "center"
  | "trainer";

type Point = {
  lat: number;
  lng: number;
  color: string;
  r: number;
  category: Category;
  name: string;
};

/** Placeholder markers aligned with network legend (Arabic labels in filter UI). */
const PLACEHOLDER_POINTS: Point[] = [
  { lat: 30.0444, lng: 31.2357, color: "#FACC15", r: 0.38, category: "hq", name: "المقر" },
  {
    lat: 25.2048,
    lng: 55.2708,
    color: "#EA580C",
    r: 0.36,
    category: "founding_partner",
    name: "MEA founding",
  },
  {
    lat: 24.7136,
    lng: 46.6753,
    color: "#C9A227",
    r: 0.32,
    category: "exclusive_sovereign",
    name: "Sovereign agent",
  },
  {
    lat: 21.4225,
    lng: 39.8262,
    color: "#A16207",
    r: 0.3,
    category: "exclusive_agent",
    name: "Exclusive agent",
  },
  { lat: 15.5, lng: 32.56, color: "#3B82F6", r: 0.33, category: "center", name: "Accredited center" },
  { lat: 30.8, lng: 29.9, color: "#10B981", r: 0.3, category: "trainer", name: "Certified trainer" },
  { lat: 51.5, lng: -0.12, color: "#FACC15", r: 0.28, category: "hq", name: "Liaison" },
  { lat: 40.7, lng: -74.0, color: "#3B82F6", r: 0.3, category: "center", name: "Center" },
];

function toggleFilter(current: "all" | Category, key: Category): "all" | Category {
  return current === key ? "all" : key;
}

/** Must use inline colors so markers stay visible in production (no reliance on purged utility classes). */
const CATEGORY_LEGEND: { id: Category; label: string }[] = [
  { id: "hq", label: "المقر الرئيسي" },
  { id: "founding_partner", label: "الشريك المؤسس (وكيل الشرق الأوسط)" },
  { id: "exclusive_sovereign", label: "وكيل حصري (سيادي)" },
  { id: "exclusive_agent", label: "وكيل حصري" },
  { id: "center", label: "مركز معتمد" },
  { id: "trainer", label: "مدرب معتمد" },
];

function CategoryLegendIcon({ id }: { id: Category }) {
  const solid = (fill: string, glow: string) => (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: 16,
        height: 16,
        background: fill,
        boxShadow: `0 0 10px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.12)`,
      }}
      aria-hidden
    />
  );

  switch (id) {
    case "hq":
      return solid("#FACC15", "rgba(250, 204, 21, 0.95)");
    case "founding_partner":
      return (
        <span
          className="inline-block shrink-0 rounded-full"
          style={{
            width: 16,
            height: 16,
            background: "linear-gradient(145deg, #FDBA74 0%, #EA580C 100%)",
            boxShadow: "0 0 10px rgba(234, 88, 12, 0.9), inset 0 0 0 1px rgba(255,255,255,0.1)",
          }}
          aria-hidden
        />
      );
    case "exclusive_sovereign":
      return (
        <span
          className="relative inline-flex shrink-0 items-center justify-center"
          style={{ width: 18, height: 18 }}
          aria-hidden
        >
          <span
            className="absolute rounded-full"
            style={{
              inset: 0,
              border: "2.5px solid #C9A227",
              boxShadow: "0 0 10px rgba(201, 162, 39, 0.95), inset 0 0 4px rgba(232, 200, 74, 0.35)",
            }}
          />
          <span
            className="absolute left-1/2 top-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 8,
              height: 8,
              border: "1.5px solid #FEF9C3",
              boxShadow: "0 0 6px rgba(254, 249, 195, 0.85)",
            }}
          />
        </span>
      );
    case "exclusive_agent":
      return solid("#A16207", "rgba(180, 83, 9, 0.85)");
    case "center":
      return solid("#3B82F6", "rgba(59, 130, 246, 0.95)");
    case "trainer":
      return solid("#10B981", "rgba(16, 185, 129, 0.9)");
  }
}

export function SovereignGlobeView() {
  const locale = useLocale();
  const hostRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [activeFilter, setActiveFilter] = useState<"all" | Category>("all");

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth < 2 || clientHeight < 2) return;
      setDims({ width: clientWidth, height: clientHeight });
    });
    ro.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const pointsData = useMemo(() => {
    if (activeFilter === "all") return PLACEHOLDER_POINTS;
    return PLACEHOLDER_POINTS.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const globeProps: Partial<GlobeProps> = {
    width: dims.width,
    height: dims.height,
    backgroundColor: "rgba(0,0,0,0)",
    globeImageUrl: GLOBE_NIGHT_IMAGE,
    showAtmosphere: true,
    atmosphereColor: "rgba(201, 162, 39, 0.35)",
    atmosphereAltitude: 0.2,
    pointsData,
    pointLat: "lat",
    pointLng: "lng",
    pointColor: (d) => (d as Point).color,
    pointAltitude: 0.015,
    pointRadius: (d) => (d as Point).r,
    pointResolution: 12,
    pointLabel: (d) => (d as Point).name,
  };

  return (
    <div
      dir="rtl"
      className="relative h-[min(100dvh,100vh)] w-full min-h-112 overflow-hidden bg-navy-deep border border-[rgba(201,162,39,0.12)] rounded-xl"
    >
      <div ref={hostRef} className="absolute inset-0 z-0">
        <Globe {...globeProps} />
        <div
          className="pointer-events-none absolute inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,15,30,0.7)_100%)]"
          aria-hidden
        />
      </div>

      <header className="absolute right-4 top-4 z-30 flex max-w-[min(100%,36rem)] flex-col items-end gap-1 text-right pe-1">
        <div className="flex items-start gap-3">
          <Globe2 className="size-8 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
          <div>
            <h1
              className="text-lg font-bold leading-tight text-gold sm:text-xl"
              style={{ fontFamily: "var(--font-eb-garamond), Georgia, serif" }}
            >
              الكرة الأرضية السيادية – الشبكة العالمية iFACE
            </h1>
            <p className="mt-1 text-xs text-silver-muted sm:text-sm">
              22 دولة · مراكز معتمدة · وكلاء حصريون · نشاط حي
            </p>
          </div>
        </div>
      </header>

      <div className="absolute left-4 top-4 z-30">
        <Link
          href={`/${locale}/god-view`}
          className="inline-flex items-center gap-2 rounded-lg border border-[rgba(201,162,39,0.45)] bg-[rgba(6,15,30,0.9)] px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-[rgba(201,162,39,0.1)]"
        >
          <Eye className="size-4" aria-hidden />
          عرض الكل
        </Link>
      </div>

      <aside
        className="absolute left-4 top-1/2 z-30 max-h-[72vh] w-[min(calc(100vw-2rem),17rem)] -translate-y-1/2 overflow-y-auto pe-0.5"
        dir="rtl"
      >
        <div className="flex flex-col gap-1.5">
          {CATEGORY_LEGEND.map(({ id, label }) => (
            <FilterChip
              key={id}
              pressed={activeFilter === id}
              onClick={() => setActiveFilter((f) => toggleFilter(f, id))}
              label={label}
              leading={<CategoryLegendIcon id={id} />}
            />
          ))}
        </div>
      </aside>

      <footer className="absolute bottom-0 inset-x-0 z-30 border-t border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.85)] px-4 py-2.5 text-center text-xs text-silver-muted backdrop-blur-sm">
        اسحب للتدوير · اسكرول للتكبير · انقر على الدبوس للتفاصيل
      </footer>
    </div>
  );
}

function FilterChip({
  label,
  leading,
  onClick,
  pressed,
}: {
  label: string;
  leading: React.ReactNode;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-42 max-w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-right text-xs leading-snug transition-colors sm:text-sm ${
        pressed
          ? "border-[rgba(201,162,39,0.55)] bg-[rgba(10,31,61,0.9)] text-silver ring-1 ring-[rgba(201,162,39,0.25)]"
          : "border-[rgba(201,162,39,0.2)] bg-[rgba(6,15,30,0.8)] text-silver-muted hover:border-[rgba(201,162,39,0.35)]"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{leading}</span>
      <span className="min-w-0 text-silver">{label}</span>
    </button>
  );
}
