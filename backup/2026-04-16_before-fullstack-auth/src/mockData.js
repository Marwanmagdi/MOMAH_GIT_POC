export const pageKeys = [
  "home",
  "challenges",
  "challengeDetails",
  "submitIdea",
  "chatbot",
  "admin",
  "matchmakers",
];

export const challenges = [
  {
    id: "challenge-01",
    status: "open",
    title: {
      ar: "رفع كفاءة الخدمات البلدية عبر الأتمتة الذكية",
      en: "Improve municipal services through smart automation",
    },
    owner: {
      ar: "قطاع البلديات",
      en: "Municipal Sector",
    },
    audience: {
      ar: "القطاع العام والشركات التقنية",
      en: "Public sector and technology companies",
    },
    deadline: {
      ar: "30 مايو 2026",
      en: "30 May 2026",
    },
    ideas: 24,
    overview: {
      ar: "يستهدف هذا التحدي تحسين كفاءة الإجراءات والخدمات البلدية ذات الحجم التشغيلي العالي من خلال استخدام الأتمتة والتحليلات الذكية.",
      en: "This challenge aims to improve high-volume municipal procedures and services using automation and analytics.",
    },
    goals: {
      ar: [
        "تقليل الزمن التشغيلي للمعاملات المتكررة.",
        "رفع جودة الخدمة وتجربة المستفيد.",
        "تقليل الجهد اليدوي والهدر في الموارد.",
      ],
      en: [
        "Reduce cycle time for repetitive service transactions.",
        "Improve service quality and beneficiary experience.",
        "Lower manual effort and operational waste.",
      ],
    },
    criteria: {
      ar: [
        "وضوح القيمة المضافة وقابلية القياس.",
        "جاهزية التنفيذ التقني ضمن بيئة الوزارة.",
        "مواءمة الفكرة مع سياسات الحوكمة والأمن.",
      ],
      en: [
        "Clear added value with measurable outcomes.",
        "Technical feasibility within ministry environments.",
        "Alignment with governance and security policies.",
      ],
    },
  },
  {
    id: "challenge-02",
    status: "review",
    title: {
      ar: "إدارة الأصول البلدية باستخدام إنترنت الأشياء",
      en: "Manage municipal assets through IoT-enabled monitoring",
    },
    owner: {
      ar: "قطاع الخدمات المساندة",
      en: "Support Services Sector",
    },
    audience: {
      ar: "الشركات والمختبرات التقنية",
      en: "Companies and technical labs",
    },
    deadline: {
      ar: "12 يونيو 2026",
      en: "12 June 2026",
    },
    ideas: 11,
    overview: {
      ar: "يركز التحدي على ربط الأصول الحرجة بمؤشرات تشغيلية فورية لتحسين المتابعة والصيانة التنبؤية.",
      en: "This challenge focuses on connecting critical assets to real-time operational indicators for better monitoring and predictive maintenance.",
    },
    goals: {
      ar: [
        "رفع موثوقية الأصول الميدانية.",
        "تقليل الأعطال المفاجئة والتكاليف المرتبطة بها.",
        "توفير لوحة متابعة لحظية للقرار التنفيذي.",
      ],
      en: [
        "Improve reliability of field assets.",
        "Reduce unexpected failures and related costs.",
        "Provide a real-time dashboard for executive decision-making.",
      ],
    },
    criteria: {
      ar: [
        "تكامل واضح مع بيانات الأصول الحالية.",
        "نموذج تشغيلي مستدام وقابل للتوسع.",
        "قدرة الجهة على التنفيذ التجريبي السريع.",
      ],
      en: [
        "Clear integration with current asset data.",
        "A sustainable and scalable operating model.",
        "Ability to run a rapid pilot implementation.",
      ],
    },
  },
  {
    id: "challenge-03",
    status: "open",
    title: {
      ar: "تعزيز تجربة المستفيد الرقمية في القنوات الموحدة",
      en: "Enhance digital beneficiary experience across unified channels",
    },
    owner: {
      ar: "وكالة التحول الرقمي",
      en: "Digital Transformation Agency",
    },
    audience: {
      ar: "رواد الأعمال والمستخدمون العموميون",
      en: "Entrepreneurs and public users",
    },
    deadline: {
      ar: "18 يونيو 2026",
      en: "18 June 2026",
    },
    ideas: 37,
    overview: {
      ar: "يتناول التحدي تصميم حلول رقمية تقلل التعقيد في الرحلات الخدمية وترفع معدل الرضا والإتمام.",
      en: "This challenge explores digital solutions that reduce service journey friction and increase satisfaction and completion rates.",
    },
    goals: {
      ar: [
        "تبسيط الرحلات عالية الاستخدام.",
        "تقليل نسب التخلي عن الطلبات.",
        "رفع جودة التواصل والإرشاد للمستفيد.",
      ],
      en: [
        "Simplify high-volume service journeys.",
        "Reduce application drop-off rates.",
        "Improve communication and guidance quality for beneficiaries.",
      ],
    },
    criteria: {
      ar: [
        "تصميم محوره المستخدم وقابل للقياس.",
        "جاهزية دمج الحل مع القنوات القائمة.",
        "أثر واضح على الرضا والكفاءة التشغيلية.",
      ],
      en: [
        "User-centered design with measurable outcomes.",
        "Readiness to integrate with existing channels.",
        "Clear impact on satisfaction and operating efficiency.",
      ],
    },
  },
];

export const evaluationMetrics = [
  { key: "impact", value: "4.6/5" },
  { key: "innovation", value: "4.8/5" },
  { key: "financial", value: "4.1/5" },
  { key: "technical", value: "4.7/5" },
  { key: "readiness", value: "82%" },
];

export const adminMetrics = [
  { value: "18", ar: "أفكار جديدة هذا الأسبوع", en: "New ideas this week" },
  { value: "29", ar: "أفكار بانتظار التقييم", en: "Ideas awaiting evaluation" },
  { value: "9", ar: "أفكار مؤهلة للتجربة", en: "Ideas ready for pilot" },
  { value: "5", ar: "قرارات اعتماد اليوم", en: "Approval decisions today" },
];

export const matchmakers = [
  {
    name: "SmartGov Labs",
    score: 92,
    domain: "IoT + Analytics",
    reasons: {
      ar: [
        "سجل قوي في حلول المدن الذكية.",
        "قدرة على تنفيذ تجربة سريعة خلال 8 أسابيع.",
        "تكامل مباشر مع لوحات المتابعة والتحليلات.",
      ],
      en: [
        "Strong delivery record in smart city solutions.",
        "Can launch a pilot within eight weeks.",
        "Direct fit for analytics and monitoring dashboards.",
      ],
    },
  },
  {
    name: "UrbanX Solutions",
    score: 87,
    domain: "Digital Operations",
    reasons: {
      ar: [
        "خبرة تشغيلية في أتمتة الخدمات الحكومية.",
        "فريق محلي جاهز لدعم مرحلة التحقق.",
        "نموذج تجاري مناسب للشراكات المرحلية.",
      ],
      en: [
        "Operational experience in public service automation.",
        "Local team ready to support validation work.",
        "Commercial model fits staged partnerships.",
      ],
    },
  },
  {
    name: "Future Insight",
    score: 81,
    domain: "AI Advisory",
    reasons: {
      ar: [
        "قدرات استشارية وتحليلية في النماذج الذكية.",
        "مناسب لتأطير خارطة الطريق والاستدامة.",
        "داعم قوي لحوكمة البيانات والقرارات.",
      ],
      en: [
        "Strong advisory and AI analysis capability.",
        "Helpful for roadmap and sustainability framing.",
        "Solid contributor to data and decision governance.",
      ],
    },
  },
];
