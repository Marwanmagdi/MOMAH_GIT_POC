import React, { useMemo, useState } from "react";
import { Building2, FileText, Lightbulb, Sparkles, BarChart3, Globe2, ShieldCheck, ChevronLeft, ChevronRight, Sun, Moon, LogIn } from "lucide-react";

export default function InnovationCenterPOC() {
  const [lang, setLang] = useState("ar");
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState("dark");

  const isArabic = lang === "ar";
  const logoSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAX4AAABpCAMAAAAKoLhZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAI9UExURQAAAP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2pyMFEAAAC/dFJOUwCOUP7vARCu/yEwzo8g3oFAr+6fcIDPkGGgv75gnjERb99fcVF/QUjX+1Tqg8M8CMrnDBQYPTT2uwIoi6cN0uspwqsFiCR0ZB1MXPc4txwEWJt82L2crOkWo0JVmSv0/YzRx3hG26VyU6h6TU5Ly2oippgOoQ/shI3hBrHz40SXJmXmSWyH8mm2JbPUG1Jb06Qj3Gd9LtoS8Ykt+rriV2MqskU1FR+iGdb4HkP53T537ZpHCcZmLFm4lcnAezZorYr/WQAAAAlwSFlzAAAXEQAAFxEByibzPwAAFK5JREFUeF7tnf2b3cZVx+dKc2fP6krX0pU0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";

  const palette = theme === "dark"
    ? {
        primary: "#91B83E",
        primaryDeep: "#6E9228",
        primarySoft: "#B8D96A",
        background: "#070B05",
        surface: "#0F150C",
        surfaceAlt: "#141D10",
        border: "rgba(145,184,62,0.18)",
        text: "#F8FAF5",
        muted: "#AEB8A3",
        dim: "#7A8570",
        glow: "rgba(145,184,62,0.16)",
        overlay: "rgba(7,11,5,0.88)",
        subtleBg: "rgba(255,255,255,0.03)",
        subtleBgStrong: "rgba(255,255,255,0.08)",
        heroTint: "rgba(145,184,62,0.10)",
      }
    : {
        primary: "#7BAA2F",
        primaryDeep: "#5E8520",
        primarySoft: "#A6C95A",
        background: "#F7FAF2",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F6E8",
        border: "rgba(123,170,47,0.20)",
        text: "#172112",
        muted: "#5F6B56",
        dim: "#7A8570",
        glow: "rgba(123,170,47,0.10)",
        overlay: "rgba(247,250,242,0.88)",
        subtleBg: "rgba(123,170,47,0.05)",
        subtleBgStrong: "rgba(123,170,47,0.12)",
        heroTint: "rgba(123,170,47,0.08)",
      };

  const t = {
    ar: {
      brand: "منصة مركز الابتكار",
      subBrand: "وزارة البلديات والإسكان",
      demo: "عرض إثبات مفهوم — POC",
      login: "تسجيل الدخول",
      language: "English",
      nav: {
        home: "الرئيسية",
        challenges: "التحديات",
        challengeDetails: "تفاصيل التحدي",
        submitIdea: "تقديم فكرة",
        admin: "لوحة الإدارة",
        matchmakers: "Matchmakers",
      },
      hero: {
        title: "منصة موحدة لإدارة التحديات والأفكار الابتكارية",
        desc: "نموذج أولي احترافي لعرض رحلة التحدي من النشر إلى استقبال الأفكار، ثم التقييم واتخاذ القرار، مع مكوّن أولي للمطابقة الذكية بين التحديات والجهات المناسبة.",
        ctaPrimary: "استعرض التحديات",
        ctaSecondary: "ابدأ تقديم فكرة",
        note: "مصمم خصيصًا لعرض العميل ويمكن تطويره لاحقًا إلى منصة تشغيلية كاملة.",
      },
      home: {
        sectionTitle: "مؤشرات المنصة",
        sectionSubtitle: "لقطة سريعة على قيمة المنصة في النسخة التجريبية.",
        featureTitle: "ما الذي يعرضه هذا النموذج؟",
        featureSubtitle: "يركز الـ POC على القصة الأهم للعميل: التحدي، الفكرة، التقييم، والمواءمة.",
      },
      kpis: [
        { label: "التحديات المنشورة", value: "12" },
        { label: "الأفكار المقدمة", value: "148" },
        { label: "الأفكار قيد التقييم", value: "29" },
        { label: "الجهات المسجلة", value: "34" },
      ],
      features: [
        ["نشر التحديات", "إدارة وعرض التحديات بشكل واضح ومنظم"],
        ["تقديم الأفكار", "تجربة سهلة وسريعة لرفع الأفكار والمقترحات"],
        ["التقييم", "بطاقات تقييم مبسطة تعكس آلية الحوكمة"],
        ["المواءمة الذكية", "تصور أولي لترشيح الجهات المناسبة للتحديات"],
      ],
      challenges: {
        title: "التحديات النشطة",
        subtitle: "عرض مبسط للتحديات المنشورة مع الحالة والفئة المستهدفة وعدد الأفكار.",
        details: "تفاصيل التحدي",
        submit: "تقديم فكرة",
        owner: "الجهة المالكة",
        audience: "الفئة المستهدفة",
        deadline: "آخر موعد",
        ideas: "عدد الأفكار",
      },
      challengeDetails: {
        title: "تفاصيل التحدي",
        subtitle: "صفحة مستقلة لتوضيح العرض العام، الأهداف، ومعايير المشاركة.",
        overview: "نظرة عامة",
        goals: "أهداف التحدي",
        criteria: "معايير المشاركة",
        action: "ابدأ تقديم فكرة",
      },
      submitIdea: {
        title: "نموذج تقديم فكرة",
        subtitle: "نموذج واضح ومناسب للعرض يبرز سهولة الاستخدام ودعم اللغة العربية.",
        submit: "إرسال الطلب",
        agree: "أوافق على الشروط والإقرار",
        fields: [
          "اسم صاحب الفكرة",
          "البريد الإلكتروني",
          "رقم الجوال",
          "عنوان الفكرة",
          "التحدي المرتبط",
          "تصنيف الفكرة",
          "وصف الفكرة",
          "الأثر المتوقع",
        ],
      },
      admin: {
        title: "لوحة الإدارة والتقييم",
        subtitle: "عرض تنفيذي يوضح كيف يمكن متابعة الأفكار، تقييمها، واتخاذ القرار عليها.",
        quick: "مؤشرات سريعة",
        scorecard: "بطاقة تقييم الفكرة",
        final: "النتيجة النهائية",
      },
      adminKpis: [
        ["أفكار جديدة", "18"],
        ["قيد التقييم", "29"],
        ["مؤهلة", "9"],
        ["مرفوضة", "5"],
      ],
      scoreItems: [
        ["التأثير والأهمية", "4/5"],
        ["مستوى الابتكار", "5/5"],
        ["القيمة المضافة", "4/5"],
        ["الجدوى المالية", "4/5"],
        ["الجدوى التقنية", "5/5"],
      ],
      matchmakers: {
        title: "Matchmakers — المطابقة الذكية",
        subtitle: "تصور أولي لعرض التحدي وربطه بالجهات الأكثر مناسبة وفق درجة تطابق واضحة.",
        selected: "التحدي المختار",
        entities: "الجهات المرشحة",
        score: "درجة التطابق",
      },
      statuses: {
        open: "مفتوح",
        closed: "مغلق",
      },
      footer: "نموذج أولي قابل للتوسعة لمرحلة لاحقة",
    },
    en: {
      brand: "Innovation Center Platform",
      subBrand: "Ministry of Municipalities and Housing",
      demo: "Proof of Concept — POC",
      login: "Login",
      language: "العربية",
      nav: {
        home: "Home",
        challenges: "Challenges",
        challengeDetails: "Challenge Details",
        submitIdea: "Submit Idea",
        admin: "Admin Dashboard",
        matchmakers: "Matchmakers",
      },
      hero: {
        title: "A unified platform for innovation challenges and idea management",
        desc: "A polished prototype that demonstrates the full journey from challenge publishing to idea submission, evaluation, decision-making, and an initial smart matching experience.",
        ctaPrimary: "View Challenges",
        ctaSecondary: "Start Submitting",
        note: "Designed for client presentation today, with room to evolve into a full production platform later.",
      },
      home: {
        sectionTitle: "Platform KPIs",
        sectionSubtitle: "A quick snapshot of the POC value proposition.",
        featureTitle: "What does this prototype show?",
        featureSubtitle: "The POC focuses on the story the client cares about most: challenge, idea, evaluation, and matching.",
      },
      kpis: [
        { label: "Published Challenges", value: "12" },
        { label: "Submitted Ideas", value: "148" },
        { label: "Ideas Under Review", value: "29" },
        { label: "Registered Entities", value: "34" },
      ],
      features: [
        ["Challenge Publishing", "Organized publishing and presentation of innovation challenges"],
        ["Idea Submission", "A simple and clear submission experience"],
        ["Evaluation", "A governance-style scoring preview for submitted ideas"],
        ["Smart Matching", "An initial recommendation view for matching entities to challenges"],
      ],
      challenges: {
        title: "Active Challenges",
        subtitle: "A simple view of published challenges with status, audience, and idea counts.",
        details: "View Details",
        submit: "Submit Idea",
        owner: "Owner",
        audience: "Audience",
        deadline: "Deadline",
        ideas: "Ideas",
      },
      challengeDetails: {
        title: "Challenge Details",
        subtitle: "A dedicated page for overview, goals, and participation criteria.",
        overview: "Overview",
        goals: "Goals",
        criteria: "Participation Criteria",
        action: "Start Submitting an Idea",
      },
      submitIdea: {
        title: "Idea Submission Form",
        subtitle: "A clean presentation-ready form that highlights usability and bilingual support.",
        submit: "Submit Request",
        agree: "I agree to the terms and declaration",
        fields: [
          "Idea Owner Name",
          "Email Address",
          "Mobile Number",
          "Idea Title",
          "Related Challenge",
          "Idea Category",
          "Idea Description",
          "Expected Impact",
        ],
      },
      admin: {
        title: "Admin & Evaluation Dashboard",
        subtitle: "An executive view of how ideas can be reviewed, scored, and actioned.",
        quick: "Quick Metrics",
        scorecard: "Idea Evaluation Card",
        final: "Final Score",
      },
      adminKpis: [
        ["New Ideas", "18"],
        ["Under Review", "29"],
        ["Qualified", "9"],
        ["Rejected", "5"],
      ],
      scoreItems: [
        ["Impact & Importance", "4/5"],
        ["Innovation Level", "5/5"],
        ["Added Value", "4/5"],
        ["Financial Feasibility", "4/5"],
        ["Technical Feasibility", "5/5"],
      ],
      matchmakers: {
        title: "Matchmakers — Smart Matching",
        subtitle: "An initial concept for linking approved challenges with the most relevant external entities.",
        selected: "Selected Challenge",
        entities: "Recommended Entities",
        score: "Matching Score",
      },
      statuses: {
        open: "Open",
        closed: "Closed",
      },
      footer: "Expandable prototype for a future implementation phase",
    },
  }[lang];

  const challenges = useMemo(
    () => [
      {
        id: 1,
        title: isArabic ? "رفع كفاءة الخدمات البلدية" : "Improving Municipal Service Efficiency",
        owner: isArabic ? "قطاع البلديات" : "Municipal Sector",
        audience: isArabic ? "الجميع" : "Public",
        status: t.statuses.open,
        deadline: isArabic ? "30 مايو 2026" : "30 May 2026",
        ideas: 24,
      },
      {
        id: 2,
        title: isArabic ? "حلول ذكية لإدارة الأصول" : "Smart Asset Management Solutions",
        owner: isArabic ? "قطاع الخدمات المساندة" : "Support Services Sector",
        audience: isArabic ? "شركات" : "Companies",
        status: t.statuses.open,
        deadline: isArabic ? "12 يونيو 2026" : "12 June 2026",
        ideas: 11,
      },
      {
        id: 3,
        title: isArabic ? "تحسين تجربة المستفيد الرقمي" : "Improving Digital Beneficiary Experience",
        owner: isArabic ? "وكالة التحول الرقمي" : "Digital Transformation Agency",
        audience: isArabic ? "رواد أعمال" : "Entrepreneurs",
        status: t.statuses.closed,
        deadline: isArabic ? "15 أبريل 2026" : "15 April 2026",
        ideas: 37,
      },
    ],
    [isArabic, t.statuses]
  );

  const entities = useMemo(
    () => [
      {
        name: "SmartGov Labs",
        type: isArabic ? "شركة تقنية" : "Technology Company",
        domain: "IoT + Analytics",
        score: 92,
      },
      {
        name: "UrbanX Solutions",
        type: isArabic ? "مزود حلول" : "Solution Provider",
        domain: "Smart Operations",
        score: 87,
      },
      {
        name: "Future Insight",
        type: isArabic ? "جهة استشارية" : "Consulting Firm",
        domain: "AI + Strategy",
        score: 81,
      },
    ],
    [isArabic]
  );

  const navItems = [
    { key: "home", label: t.nav.home },
    { key: "challenges", label: t.nav.challenges },
    { key: "challengeDetails", label: t.nav.challengeDetails },
    { key: "submitIdea", label: t.nav.submitIdea },
    { key: "admin", label: t.nav.admin },
    { key: "matchmakers", label: t.nav.matchmakers },
  ];

  const iconMap = [Building2, Lightbulb, BarChart3, Sparkles];

  const Card = ({ children, className = "", style = {} }) => (
    <div
      className={`rounded-[28px] border shadow-2xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
        borderColor: palette.border,
        boxShadow: `0 20px 60px ${palette.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: palette.text }}>{title}</h2>
      <p className="mt-2 text-sm md:text-base max-w-3xl" style={{ color: palette.muted }}>{subtitle}</p>
    </div>
  );

  const PageShell = ({ children }) => (
    <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">{children}</div>
  );

  const StatusPill = ({ label }) => (
    <div
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: palette.heroTint, color: palette.primarySoft, border: `1px solid ${palette.border}` }}
    >
      {label}
    </div>
  );

  const HeroPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full border-8" style={{ borderColor: palette.primary }} />
      <div className="absolute top-16 right-16 h-44 w-44 rotate-12 rounded-[32px] border-[7px]" style={{ borderColor: palette.primary }} />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rotate-45 rounded-[34px] border-[7px]" style={{ borderColor: palette.primary }} />
      <div className="absolute bottom-20 right-10 h-32 w-32 rounded-[28px] border-[6px]" style={{ borderColor: palette.primarySoft }} />
    </div>
  );

  const HomePage = () => <PageShell><div>Packaged prototype. Use the original canvas code if you need exact UI behavior.</div></PageShell>;

  const pages = { home: <HomePage /> };
  const DirIcon = isArabic ? ChevronLeft : ChevronRight;
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <div className="min-h-screen" dir={isArabic ? "rtl" : "ltr"} style={{ background: `radial-gradient(circle at top, ${palette.heroTint}, transparent 28%), ${palette.background}`, color: palette.text }}>
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ background: palette.overlay, borderColor: palette.border }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-4">
          <div className="flex items-start md:items-center justify-between gap-4 flex-wrap md:flex-nowrap">
            <div className="flex items-center shrink-0">
              <div className="px-1 py-1">
                <img
                  src={logoSrc}
                  alt="MOMAH"
                  className="h-12 md:h-14 w-auto object-contain"
                  style={{
                    filter: theme === "light" ? "brightness(0) saturate(100%)" : "none",
                  }}
                />
              </div>
            </div>

            <nav className="basis-full order-3 md:order-none md:flex-1">
              <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap md:flex-nowrap">
                {navItems.map((item) => {
                  const active = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setPage(item.key)}
                      className="px-3 md:px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold border transition-all whitespace-nowrap min-w-[104px] md:min-w-[110px] text-center flex-none"
                      style={{
                        color: active ? "#0A0A0A" : palette.text,
                        background: active ? palette.primary : palette.subtleBg,
                        borderColor: active ? palette.primary : palette.border,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="px-2 md:px-2.5 py-1.5 rounded-2xl font-medium border text-[11px] md:text-sm leading-none"
                style={{ color: palette.text, borderColor: palette.border, background: palette.subtleBg }}
              >
                <span className="inline-flex items-center gap-2">
                  <ThemeIcon className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {theme === "dark" ? (isArabic ? "فاتح" : "Light") : (isArabic ? "داكن" : "Dark")}
                  </span>
                </span>
              </button>

              <button
                onClick={() => setLang(isArabic ? "en" : "ar")}
                className="px-2 md:px-2.5 py-1.5 rounded-2xl font-medium border text-[11px] md:text-sm leading-none"
                style={{ color: palette.text, borderColor: palette.border, background: palette.subtleBg }}
              >
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  <span className="hidden md:inline">{t.language}</span>
                </span>
              </button>

              <button className="px-2 md:px-2.5 py-1.5 rounded-2xl font-medium text-[11px] md:text-sm leading-none" style={{ background: palette.primary, color: "#0A0A0A" }}>
                <span className="inline-flex items-center justify-center">
                  <LogIn className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {pages[page]}

      <footer className="border-t mt-8" style={{ borderColor: palette.border }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4 flex-wrap text-sm" style={{ color: palette.dim }}>
          <div>{t.footer}</div>
          <button
            onClick={() => setPage("home")}
            className="inline-flex items-center gap-2 font-medium"
            style={{ color: palette.primarySoft }}
          >
            <DirIcon className="h-4 w-4" />
            {t.nav.home}
          </button>
        </div>
      </footer>
    </div>
  );
}
