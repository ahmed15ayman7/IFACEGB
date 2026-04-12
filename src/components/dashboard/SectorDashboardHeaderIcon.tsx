import { Building2, Cpu, Globe, GraduationCap, Landmark, Scale } from "lucide-react";

const ICONS: Record<string, typeof GraduationCap> = {
  training: GraduationCap,
  accreditation: Building2,
  consultancy: Scale,
  tech: Cpu,
  partnerships: Globe,
};

export function SectorDashboardHeaderIcon({ slug }: { slug: string }) {
  const Icon = ICONS[slug] ?? Landmark;
  return (
    <span className="flex size-12 items-center justify-center rounded-xl bg-[rgba(201,162,39,0.1)] border border-[rgba(201,162,39,0.2)] text-[#C9A227] shrink-0">
      <Icon className="size-7" aria-hidden />
    </span>
  );
}
