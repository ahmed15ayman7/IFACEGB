"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Mail, Globe, MapPin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020817] border-t border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-2 mb-4">
            <Image
                src="/logo-dark.png"
                alt="iFACE Global"
                width={36}
                height={36}
                className="w-auto h-8 object-contain"
              />
              <span className="text-white font-bold text-lg">iFACE GB</span>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed">
              {isRTL
                ? "البورد الدولي أي فيس للتدريب والاستشارات والتميز — منظومة سيادية رقمية تعمل عبر 22 قطاعاً في أكثر من 22 دولة."
                : "iFACE International Board for Training, Consulting & Excellence — a sovereign digital HQ operating across 22 sectors in 22+ countries."}
            </p>
          </div>

          {/* Col 2: Quick links */}
          <div dir={isRTL ? "rtl" : "ltr"}>
            <h4 className="text-white font-semibold mb-4 text-sm">
              {isRTL ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              {[
                { href: "#sectors", labelAr: "القطاعات الـ 22", labelEn: "22 Sectors" },
                { href: "#partners", labelAr: "شركاء النجاح", labelEn: "Success Partners" },
                { href: "/events", labelAr: "الفعاليات", labelEn: "Events" },
                { href: "/news", labelAr: "الأخبار", labelEn: "News" },
                { href: "/about", labelAr: "عن iFACE", labelEn: "About iFACE" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#64748B] hover:text-[#C9A227] text-sm transition-colors">
                    {isRTL ? link.labelAr : link.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Trust tools */}
          <div dir={isRTL ? "rtl" : "ltr"}>
            <h4 className="text-white font-semibold mb-4 text-sm">
              {isRTL ? "أدوات الثقة" : "Trust Tools"}
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/verify", labelAr: "التحقق من الشهادات", labelEn: "Certificate Verification" },
                { href: "/apply-agency", labelAr: "خريطة الوكلاء العالمية", labelEn: "Global Agent Map" },
                { href: "/login", labelAr: "بوابة تسجيل الدخول", labelEn: "Login Portal" },
                { href: "/contact", labelAr: "تواصل معنا", labelEn: "Contact Us" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#64748B] hover:text-[#C9A227] text-sm transition-colors">
                    {isRTL ? link.labelAr : link.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div dir={isRTL ? "rtl" : "ltr"}>
            <h4 className="text-white font-semibold mb-4 text-sm">
              {isRTL ? "تواصل معنا" : "Contact"}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[#64748B] text-sm">
                <Mail size={14} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                <span>info@iface-global.com</span>
              </li>
              <li className="flex items-start gap-2 text-[#64748B] text-sm">
                <Globe size={14} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                <span>www.iface-global.com</span>
              </li>
              <li className="flex items-start gap-2 text-[#64748B] text-sm">
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                <span>{isRTL ? "القاهرة، جمهورية مصر العربية" : "Cairo, Arab Republic of Egypt"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E293B] pt-6 flex flex-col md:flex-row items-center justify-between gap-4" dir={isRTL ? "rtl" : "ltr"}>
          <p className="text-[#475569] text-xs">
            © {currentYear} iFACE Global Board.{" "}
            {isRTL ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#475569] hover:text-[#C9A227] text-xs transition-colors">
              {isRTL ? "تسجيل الدخول" : "Login"}
            </Link>
            <Link href="/verify" className="text-[#475569] hover:text-[#C9A227] text-xs transition-colors">
              {isRTL ? "التحقق من الشهادات" : "Verify Certificate"}
            </Link>
            <Link href="/privacy" className="text-[#475569] hover:text-[#C9A227] text-xs transition-colors">
              {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
