import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://iface.global";

export type SEOKey =
  | "home"
  | "verify"
  | "sectors"
  | "training"
  | "accreditation"
  | "consultancy"
  | "tech"
  | "partnerships"
  | "about"
  | "events"
  | "news"
  | "login"
  | "register"
  | "forgot-password"
  | "apply-agency"
  | "privacy"
  | "terms"
  | "contact";

function pathForKey(key: SEOKey): string {
  switch (key) {
    case "home":
      return "";
    case "login":
      return "auth/login";
    case "register":
      return "auth/register";
    case "forgot-password":
      return "auth/forgot-password";
    default:
      return key;
  }
}

const SEO_MESSAGES: Record<
  SEOKey,
  { en: { title: string; description: string }; ar: { title: string; description: string } }
> = {
  home: {
    en: {
      title: "iFACE Global — International Accreditation & Training",
      description:
        "iFACE International Board provides world-class accreditation, training, and certification services across 5 strategic sectors.",
    },
    ar: {
      title: "iFACE العالمية — الاعتماد والتدريب الدولي",
      description:
        "المجلس الدولي iFACE يقدم خدمات الاعتماد والتدريب والشهادات على مستوى عالمي عبر 5 قطاعات استراتيجية.",
    },
  },
  verify: {
    en: {
      title: "Verify Certificate | iFACE Global",
      description:
        "Instantly verify any iFACE-issued certificate using the unique verification code on Polygon blockchain.",
    },
    ar: {
      title: "التحقق من الشهادة | iFACE",
      description:
        "تحقق فورياً من أي شهادة صادرة من iFACE باستخدام رمز التحقق الفريد على بلوكشين بوليجون.",
    },
  },
  sectors: {
    en: {
      title: "Our Sectors | iFACE Global",
      description:
        "Explore iFACE's five strategic sectors: Training, Accreditation, Consultancy, Tech Engine, and Global Partnerships.",
    },
    ar: {
      title: "قطاعاتنا | iFACE",
      description:
        "استكشف القطاعات الخمسة الاستراتيجية لـ iFACE: التدريب، الاعتماد، الاستشارات، محرك التقنية، والشراكات العالمية.",
    },
  },
  training: {
    en: {
      title: "Training & Development | iFACE Global",
      description: "Professional training programs, LMS, virtual classrooms, and certified diplomas.",
    },
    ar: {
      title: "التدريب والتطوير | iFACE",
      description: "برامج تدريب مهني، نظام إدارة تعلم، فصول افتراضية، ودبلومات معتمدة.",
    },
  },
  accreditation: {
    en: {
      title: "International Accreditation | iFACE Board",
      description: "World-recognized institutional and program accreditation with blockchain-verified credentials.",
    },
    ar: {
      title: "الاعتماد الدولي | مجلس iFACE",
      description: "اعتماد مؤسسي وبرامجي معترف به عالمياً مع بيانات اعتماد مدعومة بالبلوكشين.",
    },
  },
  consultancy: {
    en: {
      title: "Consultancy & Excellence | iFACE Global",
      description: "Strategic institutional consulting, ISO compliance, and performance excellence frameworks.",
    },
    ar: {
      title: "الاستشارات والتميز | iFACE",
      description: "استشارات مؤسسية استراتيجية، امتثال ISO، وأطر تميز الأداء.",
    },
  },
  tech: {
    en: {
      title: "Tech Engine | iFACE Global",
      description: "AI-powered EdTech, Face-ID services, sovereign cloud, and digital infrastructure.",
    },
    ar: {
      title: "محرك التقنية | iFACE",
      description: "تقنيات تعليمية بالذكاء الاصطناعي، خدمات Face-ID، سحابة سيادية، وبنية تحتية رقمية.",
    },
  },
  partnerships: {
    en: {
      title: "Global Partnerships | iFACE Global",
      description: "Master franchise network, international alliances, and cross-border expansion.",
    },
    ar: {
      title: "الشراكات العالمية | iFACE",
      description: "شبكة الامتياز الرئيسي، التحالفات الدولية، والتوسع عبر الحدود.",
    },
  },
  about: {
    en: {
      title: "About iFACE | Our Mission & Vision",
      description: "Learn about iFACE International Board — our mission, vision, leadership, and global impact.",
    },
    ar: {
      title: "عن iFACE | رسالتنا ورؤيتنا",
      description: "تعرف على المجلس الدولي iFACE — رسالتنا ورؤيتنا وقيادتنا وتأثيرنا العالمي.",
    },
  },
  events: {
    en: {
      title: "Events | iFACE Global",
      description: "Discover upcoming iFACE events, mega conferences, and professional development workshops.",
    },
    ar: {
      title: "الفعاليات | iFACE",
      description: "اكتشف فعاليات iFACE القادمة والمؤتمرات الكبرى وورش التطوير المهني.",
    },
  },
  news: {
    en: {
      title: "News | iFACE Global",
      description: "Latest news, announcements, and updates from iFACE International Board.",
    },
    ar: {
      title: "الأخبار | iFACE",
      description: "آخر الأخبار والإعلانات والتحديثات من المجلس الدولي iFACE.",
    },
  },
  login: {
    en: {
      title: "Sign In | iFACE Portal",
      description: "Sign in to your iFACE portal and access your personalized dashboard.",
    },
    ar: {
      title: "تسجيل الدخول | بوابة iFACE",
      description: "سجل دخولك إلى بوابة iFACE وادخل إلى لوحة التحكم الخاصة بك.",
    },
  },
  register: {
    en: {
      title: "Register | iFACE Portal",
      description: "Create your iFACE account to access programs, verification, and partner services.",
    },
    ar: {
      title: "تسجيل حساب | بوابة iFACE",
      description: "أنشئ حسابك على iFACE للوصول إلى البرامج والتحقق وخدمات الشركاء.",
    },
  },
  "forgot-password": {
    en: {
      title: "Forgot password | iFACE Portal",
      description: "Request a password reset link for your iFACE account.",
    },
    ar: {
      title: "نسيت كلمة المرور | بوابة iFACE",
      description: "اطلب رابط إعادة تعيين كلمة المرور لحسابك على iFACE.",
    },
  },
  "apply-agency": {
    en: {
      title: "Apply for Agency | iFACE Global",
      description: "Apply to become an authorized iFACE agent or master franchisee in your country.",
    },
    ar: {
      title: "التقديم للوكالة | iFACE",
      description: "تقدم لتصبح وكيلاً معتمداً أو صاحب امتياز رئيسي لـ iFACE في بلدك.",
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy | iFACE Global",
      description: "How iFACE Global collects, uses, and protects your personal data.",
    },
    ar: {
      title: "سياسة الخصوصية | iFACE",
      description: "كيف تجمع iFACE العالمية بياناتك الشخصية وتستخدمها وتحميها.",
    },
  },
  terms: {
    en: {
      title: "Terms of Service | iFACE Global",
      description: "Terms governing use of iFACE Global websites and digital services.",
    },
    ar: {
      title: "شروط الخدمة | iFACE",
      description: "الشروط الحاكمة لاستخدام مواقع وخدمات iFACE العالمية الرقمية.",
    },
  },
  contact: {
    en: {
      title: "Contact Us | iFACE Global",
      description: "Contact the iFACE team for partnerships, accreditation, and general inquiries.",
    },
    ar: {
      title: "تواصل معنا | iFACE",
      description: "تواصل مع فريق iFACE للشراكات والاعتماد والاستفسارات العامة.",
    },
  },
};

export function generateSEOMetadata(key: SEOKey, locale: "en" | "ar"): Metadata {
  const msgs = SEO_MESSAGES[key];
  const { title, description } = msgs[locale];
  const segment = pathForKey(key);
  const canonicalPath = segment ? `/${locale}/${segment}` : `/${locale}`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}${canonicalPath}`,
      languages: {
        en: segment ? `${BASE_URL}/en/${segment}` : `${BASE_URL}/en`,
        ar: segment ? `${BASE_URL}/ar/${segment}` : `${BASE_URL}/ar`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: "iFACE Global",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}
