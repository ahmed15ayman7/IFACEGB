"use client";

import { useScroll, useSpring, motion } from "framer-motion";
import { HeroSection } from "./sections/HeroSection";
import { SectorsDirectory } from "./sections/SectorsDirectory";
import { NewsSection } from "./sections/NewsSection";
import { EventsSection } from "./sections/EventsSection";
import { EmployeeOfMonthSection } from "./sections/EmployeeOfMonthSection";
import { PartnersSection } from "./sections/PartnersSection";
import { FooterSection } from "./sections/FooterSection";

interface Sector {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string | null;
  iconUrl: string | null;
}

interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string | null;
  imageUrl: string | null;
  category: string;
  publishedAt: string;
}

interface EventItem {
  id: string;
  titleEn: string;
  titleAr: string | null;
  location: string | null;
  startDate: string;
  eventType: string;
  coverUrl: string | null;
}

interface EmployeeOfMonth {
  id: string;
  name: string;
  nameAr: string | null;
  avatarUrl: string | null;
  jobTitleEn: string | null;
  jobTitleAr: string | null;
  departmentEn: string | null;
  departmentAr: string | null;
  kineticPoints: number;
  completedProjects: number;
  attendanceCount: number;
}

interface Partner {
  id: string;
  nameEn: string;
  nameAr: string | null;
  logoUrl: string | null;
}

interface Stats {
  employees: number;
  certificates: number;
  agents: number;
  countries: number;
}

export interface NewPublicLandingProps {
  sectors: Sector[];
  news: NewsItem[];
  events: EventItem[];
  employeeOfMonth: EmployeeOfMonth | null;
  partners: Partner[];
  stats: Stats;
}

export function NewPublicLanding({
  sectors,
  news,
  events,
  employeeOfMonth,
  partners,
  stats,
}: NewPublicLandingProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-[#C9A227] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Sections */}
      <HeroSection stats={stats} />
      <SectorsDirectory sectors={sectors} />
      <NewsSection news={news} />
      <EventsSection events={events} />
      <EmployeeOfMonthSection employee={employeeOfMonth} />
      <PartnersSection partners={partners} />
      <FooterSection />
    </div>
  );
}
