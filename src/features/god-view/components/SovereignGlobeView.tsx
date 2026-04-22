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
    <div className="absolute inset-0 flex items-center justify-center bg-[#060f1e] text-[#6e7d93] text-sm">
      جاري تحميل الكرة الأرضية…
    </div>
  ),
});

const GLOBE_NIGHT_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-night.jpg";

type Category = "hq" | "partner" | "center";

type Point = {
  lat: number;
  lng: number;
  color: string;
  r: number;
  category: Category;
  name: string;
};

const PLACEHOLDER_POINTS: Point[] = [
  { lat: 30.0444, lng: 31.2357, color: "#EAB308", r: 0.35, category: "hq", name: "Cairo" },
  { lat: 24.7136, lng: 46.6753, color: "#C9A227", r: 0.3, category: "partner", name: "Riyadh" },
  { lat: 25.2048, lng: 55.2708, color: "#60A5FA", r: 0.34, category: "center", name: "Dubai" },
  { lat: 21.4225, lng: 39.8262, color: "#EAB308", r: 0.3, category: "hq", name: "Jeddah" },
  { lat: 15.5, lng: 32.5, color: "#60A5FA", r: 0.3, category: "center", name: "Khartoum" },
];

function toggleFilter(current: "all" | Category, key: Category): "all" | Category {
  return current === key ? "all" : key;
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
      className="relative h-[min(100dvh,100vh)] w-full min-h-[28rem] overflow-hidden bg-[#060f1e] border border-[rgba(201,162,39,0.12)] rounded-xl"
    >
      <div ref={hostRef} className="absolute inset-0 z-0">
        <Globe {...globeProps} />
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,15,30,0.7)_100%)]"
          aria-hidden
        />
      </div>

      <header className="absolute right-4 top-4 z-30 flex max-w-[min(100%,36rem)] flex-col items-end gap-1 text-right pe-1">
        <div className="flex items-start gap-3">
          <Globe2 className="size-8 shrink-0 text-[#C9A227]" strokeWidth={1.2} aria-hidden />
          <div>
            <h1
              className="text-lg font-bold leading-tight text-[#C9A227] sm:text-xl"
              style={{ fontFamily: "var(--font-eb-garamond), Georgia, serif" }}
            >
              الكرة الأرضية السيادية – الشبكة العالمية iFACE
            </h1>
            <p className="mt-1 text-xs text-[#6e7d93] sm:text-sm">
              22 دولة · مراكز معتمدة · وكلاء حصريون · نشاط حي
            </p>
          </div>
        </div>
      </header>

      <div className="absolute left-4 top-4 z-30">
        <Link
          href={`/${locale}/god-view`}
          className="inline-flex items-center gap-2 rounded-lg border border-[rgba(201,162,39,0.45)] bg-[rgba(6,15,30,0.9)] px-3 py-2 text-sm font-medium text-[#C9A227] transition-colors hover:bg-[rgba(201,162,39,0.1)]"
        >
          <Eye className="size-4" aria-hidden />
          عرض الكل
        </Link>
      </div>

      <aside className="absolute left-4 top-1/2 z-30 -translate-y-1/2" dir="rtl">
        <div className="flex flex-col gap-2">
          <FilterChip
            pressed={activeFilter === "hq"}
            onClick={() => setActiveFilter((f) => toggleFilter(f, "hq"))}
            label="مقر رئيسي"
            leading={<span className="size-2.5 rounded-full bg-[#EAB308] shadow-[0_0_6px_rgba(234,179,8,0.7)]" />}
          />
          <FilterChip
            pressed={activeFilter === "partner"}
            onClick={() => setActiveFilter((f) => toggleFilter(f, "partner"))}
            label="شريك تنفيذي"
            leading={<span className="size-3 rounded-full border-2 border-[#C9A227] bg-transparent" />}
          />
          <FilterChip
            pressed={activeFilter === "center"}
            onClick={() => setActiveFilter((f) => toggleFilter(f, "center"))}
            label="مركز معتمد"
            leading={
              <span className="size-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
            }
          />
        </div>
      </aside>

      <footer className="absolute bottom-0 inset-x-0 z-30 border-t border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.85)] px-4 py-2.5 text-center text-xs text-[#6e7d93] backdrop-blur-sm">
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
      className={`flex min-w-[10.5rem] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-right text-sm transition-colors ${
        pressed
          ? "border-[rgba(201,162,39,0.55)] bg-[rgba(10,31,61,0.9)] text-[#A8B5C8] ring-1 ring-[rgba(201,162,39,0.25)]"
          : "border-[rgba(201,162,39,0.2)] bg-[rgba(6,15,30,0.8)] text-[#6e7d93] hover:border-[rgba(201,162,39,0.35)]"
      }`}
    >
      {leading}
      <span className="text-[#A8B5C8]">{label}</span>
    </button>
  );
}
