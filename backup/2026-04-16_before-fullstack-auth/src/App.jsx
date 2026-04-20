import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Globe2,
  Lightbulb,
  LogIn,
  Send,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Workflow,
} from "lucide-react";
import { requestChatbotReply } from "./chatbotApi";
import { copy } from "./translations";
import { adminMetrics, challenges, evaluationMetrics, matchmakers, pageKeys } from "./mockData";
import brandLogoLight from "../assets/logo.png";
import brandLogoDark from "./assets/logo-dark.svg";
import backgroundMotif from "../assets/background_img.png";

const themes = {
  dark: {
    bg: "#07110b",
    bgAlt: "#0d1711",
    panel: "rgba(14, 28, 19, 0.88)",
    panelSoft: "#173121",
    line: "rgba(164, 206, 94, 0.16)",
    text: "#f4fbef",
    muted: "#b8c7b4",
    accent: "#9cc84b",
    accentStrong: "#7aaa30",
    accentSoft: "#d7ecaf",
    chip: "rgba(156, 200, 75, 0.14)",
    shadow: "rgba(0, 0, 0, 0.32)",
  },
  light: {
    bg: "#f6faef",
    bgAlt: "#edf5e2",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSoft: "#eef5e2",
    line: "rgba(90, 125, 41, 0.14)",
    text: "#182313",
    muted: "#5c6c57",
    accent: "#7fb034",
    accentStrong: "#678e28",
    accentSoft: "#e5f3c8",
    chip: "rgba(127, 176, 52, 0.12)",
    shadow: "rgba(53, 79, 36, 0.12)",
  },
};

const detailChallengeId = "challenge-01";

function createChatMessage(role, content, extras = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...extras,
  };
}

function getInitialChatMessages(language, text, detailChallenge) {
  return [
    createChatMessage("assistant", text.chatbot.welcome, {
      quickPrompts: text.chatbot.quickPrompts,
      highlight: detailChallenge.title[language],
    }),
  ];
}

function App() {
  const [language, setLanguage] = useState("ar");
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("home");
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("idle");
  const [submittedRequests, setSubmittedRequests] = useState([]);

  const text = copy[language];
  const themeTokens = themes[theme];
  const isArabic = language === "ar";
  const detailChallenge =
    challenges.find((challenge) => challenge.id === detailChallengeId) ?? challenges[0];
  const [chatMessages, setChatMessages] = useState(() =>
    getInitialChatMessages("ar", copy.ar, challenges.find((challenge) => challenge.id === detailChallengeId) ?? challenges[0])
  );

  useEffect(() => {
    document.documentElement.lang = text.meta.locale;
    document.documentElement.dir = text.meta.dir;
    document.body.style.background = themeTokens.bg;
    document.body.style.color = themeTokens.text;
  }, [text, themeTokens]);

  useEffect(() => {
    setChatMessages(getInitialChatMessages(language, text, detailChallenge));
    setChatInput("");
    setChatStatus("idle");
  }, [language, text, detailChallenge]);

  const navigation = pageKeys.map((key) => ({ key, label: text.nav[key] }));
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const DirectionIcon = isArabic ? ChevronLeft : ChevronRight;
  const brandLogo = theme === "dark" ? brandLogoDark : brandLogoLight;

  function buildChatPayload(history) {
    return history.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async function handleChatPrompt(prompt) {
    await handleChatSubmit(prompt);
  }

  async function handleChatSubmit(overrideInput) {
    const messageText = (overrideInput ?? chatInput).trim();

    if (!messageText || chatStatus === "loading") {
      return;
    }

    const userMessage = createChatMessage("user", messageText);
    const nextHistory = [...chatMessages, userMessage];

    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatStatus("loading");

    try {
      const result = await requestChatbotReply({
        language,
        message: messageText,
        history: buildChatPayload(nextHistory),
        detailChallenge: {
          id: detailChallenge.id,
          title: detailChallenge.title[language],
          owner: detailChallenge.owner[language],
          audience: detailChallenge.audience[language],
          deadline: detailChallenge.deadline[language],
          overview: detailChallenge.overview[language],
          goals: detailChallenge.goals[language],
          criteria: detailChallenge.criteria[language],
        },
        challenges: challenges.map((challenge) => ({
          id: challenge.id,
          status: challenge.status,
          title: challenge.title[language],
          owner: challenge.owner[language],
          audience: challenge.audience[language],
          deadline: challenge.deadline[language],
          ideas: challenge.ideas,
          overview: challenge.overview[language],
        })),
      });

      const assistantMessage = createChatMessage("assistant", result.reply, {
        ...(result.submission
          ? {
              submission: {
                type:
                  result.submission.kind === "challenge"
                    ? text.chatbot.challengeType
                    : text.chatbot.ideaType,
                title: result.submission.title,
                detail: result.submission.detail,
              },
            }
          : {}),
      });

      setChatMessages((current) => [...current, assistantMessage]);

      if (result.submission) {
        setSubmittedRequests((current) => [
          {
            id: `${result.submission.kind}-${Date.now()}`,
            kind: result.submission.kind,
            title: result.submission.title,
            detail: result.submission.detail,
          },
          ...current,
        ]);
      }
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        createChatMessage(
          "assistant",
          error instanceof Error && error.message ? error.message : text.chatbot.errorMessage
        ),
      ]);
    } finally {
      setChatStatus("idle");
    }
  }

  return (
    <div
      className="app-shell"
      dir={text.meta.dir}
      style={{
        "--bg": themeTokens.bg,
        "--bg-alt": themeTokens.bgAlt,
        "--panel": themeTokens.panel,
        "--panel-soft": themeTokens.panelSoft,
        "--line": themeTokens.line,
        "--text": themeTokens.text,
        "--muted": themeTokens.muted,
        "--accent": themeTokens.accent,
        "--accent-strong": themeTokens.accentStrong,
        "--accent-soft": themeTokens.accentSoft,
        "--chip": themeTokens.chip,
        "--shadow": themeTokens.shadow,
        "--nav-columns": navigation.length,
      }}
    >
      <div className="app-motif" aria-hidden="true">
        <img src={backgroundMotif} alt="" />
      </div>
      <div className="page-glow page-glow-one" />
      <div className="page-glow page-glow-two" />

      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-main-row">
            <BrandBlock logo={brandLogo} />

            <div className="utility-actions">
              <button
                type="button"
                className="utility-button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <ThemeIcon size={16} />
                <span className="utility-label">
                  {theme === "dark" ? text.meta.switchThemeLight : text.meta.switchThemeDark}
                </span>
              </button>

              <button
                type="button"
                className="utility-button"
                onClick={() => setLanguage(isArabic ? "en" : "ar")}
              >
                <Globe2 size={16} />
                <span className="utility-label">{text.meta.switchLanguage}</span>
              </button>

              <button type="button" className="login-button" aria-label={text.brand.login}>
                <LogIn size={16} />
              </button>
            </div>
          </div>

          <nav className="nav-strip" aria-label="Primary">
            {navigation.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-button ${page === item.key ? "active" : ""}`}
                onClick={() => setPage(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="content-shell">
        {page === "home" && (
          <>
            <section className="hero-card">
              <div className="hero-copy">
                <div className="eyebrow">{text.hero.eyebrow}</div>
                <h1>{text.hero.title}</h1>
                <p>{text.hero.description}</p>
                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={() => setPage("challenges")}>
                    {text.hero.primaryAction}
                    <DirectionIcon size={18} />
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setPage("submitIdea")}>
                    {text.hero.secondaryAction}
                  </button>
                </div>
                <div className="hero-footnote">{text.hero.footnote}</div>
              </div>

              <div className="hero-side">
                <div className="hero-highlight">
                  <Sparkles size={18} />
                  <span>{text.matchmakers.title}</span>
                </div>
                <div className="hero-metric-grid">
                  {text.highlights.stats.map((item) => (
                    <InfoCard key={item.label} value={item.value} label={item.label} compact />
                  ))}
                </div>
              </div>
            </section>

            <SectionHeader title={text.highlights.title} subtitle={text.highlights.subtitle} />
            <div className="stats-grid">
              {text.highlights.stats.map((item) => (
                <InfoCard key={item.label} value={item.value} label={item.label} />
              ))}
            </div>

            <SectionHeader title={text.operatingModel.title} subtitle={text.operatingModel.subtitle} />
            <div className="timeline-grid">
              {text.operatingModel.stages.map((stage) => (
                <article key={stage.step} className="timeline-card">
                  <span className="timeline-step">{stage.step}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.text}</p>
                </article>
              ))}
            </div>

            <SectionHeader title={text.valueProps.title} subtitle={text.valueProps.subtitle} />
            <div className="feature-grid">
              {text.valueProps.items.map((item, index) => (
                <FeatureCard key={item.title} icon={getFeatureIcon(index)} title={item.title} text={item.text} />
              ))}
            </div>

            <SectionHeader title={text.roles.title} subtitle={text.roles.subtitle} />
            <div className="list-panel">
              {text.roles.items.map((item) => (
                <div key={item} className="list-row">
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {page === "challenges" && (
          <>
            <SectionHeader title={text.challenges.title} subtitle={text.challenges.subtitle} />
            <div className="challenge-grid">
              {challenges.map((challenge) => (
                <article key={challenge.id} className="challenge-card">
                  <div className="challenge-top">
                    <StatusPill
                      label={
                        challenge.status === "open"
                          ? text.challenges.statusOpen
                          : text.challenges.statusReview
                      }
                    />
                    <span className="challenge-ideas">
                      {challenge.ideas} {text.challenges.ideas}
                    </span>
                  </div>
                  <h3>{challenge.title[language]}</h3>
                  <p>{challenge.overview[language]}</p>
                  <dl className="challenge-meta">
                    <ChallengeMetaItem label={text.challenges.owner} value={challenge.owner[language]} />
                    <ChallengeMetaItem label={text.challenges.audience} value={challenge.audience[language]} />
                    <ChallengeMetaItem label={text.challenges.deadline} value={challenge.deadline[language]} />
                  </dl>
                  <div className="card-actions">
                    <button type="button" className="secondary-button" onClick={() => setPage("challengeDetails")}>
                      {text.challenges.detailsAction}
                    </button>
                    <button type="button" className="primary-button" onClick={() => setPage("submitIdea")}>
                      {text.challenges.submitAction}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {page === "challengeDetails" && (
          <>
            <SectionHeader title={text.challengeDetails.title} subtitle={text.challengeDetails.subtitle} />
            <div className="detail-layout">
              <article className="panel-card">
                <div className="detail-heading">
                  <StatusPill label={text.challenges.statusOpen} />
                  <h2>{detailChallenge.title[language]}</h2>
                  <p>{detailChallenge.overview[language]}</p>
                </div>

                <div className="detail-sections">
                  <DetailBlock title={text.challengeDetails.overview} items={[detailChallenge.overview[language]]} />
                  <DetailBlock title={text.challengeDetails.goals} items={detailChallenge.goals[language]} />
                  <DetailBlock title={text.challengeDetails.criteria} items={detailChallenge.criteria[language]} />
                </div>
              </article>

              <aside className="side-column">
                <div className="panel-card">
                  <h3>{text.challengeDetails.readiness}</h3>
                  <div className="readiness-list">
                    <ReadinessItem label={text.challenges.owner} value={detailChallenge.owner[language]} />
                    <ReadinessItem label={text.challenges.audience} value={detailChallenge.audience[language]} />
                    <ReadinessItem label={text.challenges.deadline} value={detailChallenge.deadline[language]} />
                    <ReadinessItem label={text.challenges.ideas} value={String(detailChallenge.ideas)} />
                  </div>
                </div>

                <div className="panel-card">
                  <button type="button" className="primary-button block-button" onClick={() => setPage("submitIdea")}>
                    {text.challengeDetails.action}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        {page === "submitIdea" && (
          <>
            <SectionHeader title={text.submitIdea.title} subtitle={text.submitIdea.subtitle} />
            <div className="form-layout">
              <form className="panel-card form-card">
                <div className="form-group-title">{text.submitIdea.sections.profile}</div>
                <div className="form-grid">
                  <Field label={text.submitIdea.fields.fullName} placeholder={text.submitIdea.fields.fullName} />
                  <Field label={text.submitIdea.fields.email} placeholder="name@example.com" />
                  <Field label={text.submitIdea.fields.mobile} placeholder="+966 5X XXX XXXX" />
                </div>

                <div className="form-group-title">{text.submitIdea.sections.proposal}</div>
                <div className="form-grid">
                  <Field label={text.submitIdea.fields.title} placeholder={text.submitIdea.fields.title} />
                  <Field label={text.submitIdea.fields.challenge} placeholder={detailChallenge.title[language]} />
                  <Field label={text.submitIdea.fields.category} placeholder="GovTech / Urban Services" />
                </div>

                <Field label={text.submitIdea.fields.description} placeholder={text.submitIdea.fields.description} multiline />
                <Field label={text.submitIdea.fields.impact} placeholder={text.submitIdea.fields.impact} multiline />

                <label className="checkbox-row">
                  <input type="checkbox" defaultChecked />
                  <span>{text.submitIdea.agreement}</span>
                </label>

                <button type="button" className="primary-button submit-button">
                  {text.submitIdea.submit}
                </button>
              </form>

              <aside className="side-column">
                <div className="panel-card">
                  <h3>{detailChallenge.title[language]}</h3>
                  <p>{detailChallenge.overview[language]}</p>
                </div>
                <div className="panel-card">
                  <h3>{text.challengeDetails.criteria}</h3>
                  <div className="bullet-list">
                    {detailChallenge.criteria[language].map((item) => (
                      <div key={item} className="list-row">
                        <ShieldCheck size={18} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {page === "chatbot" && (
          <>
            <SectionHeader title={text.chatbot.title} subtitle={text.chatbot.subtitle} />
            <div className="chatbot-layout">
              <article className="panel-card chatbot-shell">
                <div className="chatbot-thread">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}
                    >
                      <div className="chat-avatar">
                        {message.role === "user" ? <User size={18} /> : <Bot size={18} />}
                      </div>
                      <div className="chat-bubble">
                        <div className="chat-label">
                          {message.role === "user" ? text.chatbot.userLabel : text.chatbot.assistantLabel}
                        </div>
                        <p>{message.content}</p>
                        {message.highlight && <div className="chat-pill">{message.highlight}</div>}
                        {message.cardTitle && <div className="chat-card-title">{message.cardTitle}</div>}
                        {message.cardMeta && <div className="chat-card-meta">{message.cardMeta}</div>}
                        {message.bullets && (
                          <div className="chat-bullet-list">
                            {message.bullets.map((bullet) => (
                              <div key={bullet} className="list-row">
                                <Sparkles size={16} />
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {message.submission && (
                          <div className="chat-submission-card">
                            <div className="chat-submission-top">
                              <ClipboardCheck size={18} />
                              <span>{message.submission.type}</span>
                            </div>
                            <strong>{message.submission.title}</strong>
                            <p>{message.submission.detail}</p>
                          </div>
                        )}
                        {message.quickPrompts && (
                          <div className="chat-quick-actions">
                            {message.quickPrompts.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                className="chat-chip-button"
                                disabled={chatStatus === "loading"}
                                onClick={() => handleChatPrompt(prompt)}
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatStatus === "loading" && (
                    <div className="chat-message assistant">
                      <div className="chat-avatar">
                        <Bot size={18} />
                      </div>
                      <div className="chat-bubble thinking-bubble">
                        <div className="chat-label">{text.chatbot.assistantLabel}</div>
                        <p>{text.chatbot.thinking}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chatbot-composer">
                  <textarea
                    rows="3"
                    value={chatInput}
                    disabled={chatStatus === "loading"}
                    placeholder={text.chatbot.placeholder}
                    onChange={(event) => setChatInput(event.target.value)}
                  />
                  <button
                    type="button"
                    className="primary-button chatbot-send"
                    disabled={chatStatus === "loading"}
                    onClick={() => handleChatSubmit()}
                  >
                    {chatStatus === "loading" ? text.chatbot.sending : text.chatbot.send}
                    <Send size={16} />
                  </button>
                </div>
              </article>

              <aside className="side-column">
                <div className="panel-card">
                  <h3>{text.chatbot.capabilitiesTitle}</h3>
                  <div className="bullet-list">
                    {text.chatbot.capabilities.map((item) => (
                      <div key={item} className="list-row">
                        <Bot size={18} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-card">
                  <h3>{text.chatbot.recentTitle}</h3>
                  {submittedRequests.length === 0 ? (
                    <p>{text.chatbot.emptyState}</p>
                  ) : (
                    <div className="chatbot-request-list">
                      {submittedRequests.map((request) => (
                        <div key={request.id} className="chatbot-request-item">
                          <span className="chatbot-request-type">
                            {request.kind === "idea" ? text.chatbot.ideaType : text.chatbot.challengeType}
                          </span>
                          <strong>{request.title}</strong>
                          <p>{request.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}

        {page === "admin" && (
          <>
            <SectionHeader title={text.admin.title} subtitle={text.admin.subtitle} />
            <div className="stats-grid">
              {adminMetrics.map((metric) => (
                <InfoCard key={metric.value + metric[language]} value={metric.value} label={metric[language]} />
              ))}
            </div>

            <div className="admin-layout">
              <article className="panel-card">
                <h3>{text.admin.scoreTitle}</h3>
                <div className="score-list">
                  {evaluationMetrics.map((metric, index) => (
                    <div key={metric.key} className="score-row">
                      <div className="score-row-label">
                        {getMetricIcon(index)}
                        <span>{getMetricLabel(metric.key, language)}</span>
                      </div>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="side-column">
                <div className="panel-card">
                  <h3>{text.admin.decisionTitle}</h3>
                  <p>{text.admin.decisionText}</p>
                  <button type="button" className="secondary-button block-button" onClick={() => setPage("matchmakers")}>
                    {text.matchmakers.title}
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        {page === "matchmakers" && (
          <>
            <SectionHeader title={text.matchmakers.title} subtitle={text.matchmakers.subtitle} />
            <div className="admin-layout">
              <article className="panel-card">
                <h3>{text.matchmakers.selected}</h3>
                <div className="matchmaker-selected">
                  <div>
                    <strong>{detailChallenge.title[language]}</strong>
                    <p>{detailChallenge.overview[language]}</p>
                  </div>
                  <div className="matchmaker-chip">
                    <Workflow size={18} />
                    <span>{detailChallenge.owner[language]}</span>
                  </div>
                </div>
              </article>

              <aside className="side-column">
                {matchmakers.map((entity) => (
                  <div key={entity.name} className="panel-card">
                    <div className="matchmaker-header">
                      <div>
                        <h3>{entity.name}</h3>
                        <p>{entity.domain}</p>
                      </div>
                      <div className="score-badge">
                        {entity.score}% {text.matchmakers.score}
                      </div>
                    </div>
                    <div className="bullet-list">
                      {entity.reasons[language].map((reason) => (
                        <div key={reason} className="list-row">
                          <Sparkles size={18} />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </>
        )}
      </main>

      <footer className="footer-bar">
        <span>{text.footer}</span>
        <button type="button" className="footer-link" onClick={() => setPage("home")}>
          <DirectionIcon size={16} />
          {text.nav.home}
        </button>
      </footer>
    </div>
  );
}

function BrandBlock({ logo }) {
  return (
    <div className="brand-block">
      <img
        className="brand-logo"
        src={logo}
        alt="Ministry of Municipalities and Housing"
      />
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function InfoCard({ value, label, compact = false }) {
  return (
    <article className={`info-card ${compact ? "compact" : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">
        <Icon size={18} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function StatusPill({ label }) {
  return <span className="status-pill">{label}</span>;
}

function ChallengeMetaItem({ label, value }) {
  return (
    <div className="challenge-meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function DetailBlock({ title, items }) {
  return (
    <section className="detail-block">
      <h3>{title}</h3>
      <div className="bullet-list">
        {items.map((item) => (
          <div key={item} className="list-row">
            <FileCheck2 size={18} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadinessItem({ label, value }) {
  return (
    <div className="readiness-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, placeholder, multiline = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? <textarea rows="4" placeholder={placeholder} /> : <input placeholder={placeholder} />}
    </label>
  );
}

function getFeatureIcon(index) {
  const icons = [Lightbulb, Workflow, BarChart3, Sparkles];
  return icons[index % icons.length];
}

function getMetricIcon(index) {
  const icons = [BarChart3, Sparkles, ShieldCheck, FileCheck2, CheckCircle2];
  const Icon = icons[index % icons.length];
  return <Icon size={18} />;
}

function getMetricLabel(key, language) {
  const labels = {
    impact: { ar: "الأثر والأهمية", en: "Impact and importance" },
    innovation: { ar: "مستوى الابتكار", en: "Innovation level" },
    financial: { ar: "الجدوى المالية", en: "Financial feasibility" },
    technical: { ar: "الجدوى التقنية", en: "Technical feasibility" },
    readiness: { ar: "الجاهزية للتنفيذ", en: "Execution readiness" },
  };

  return labels[key][language];
}

export default App;
