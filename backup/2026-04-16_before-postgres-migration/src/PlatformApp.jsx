import { useEffect, useMemo, useState } from "react";
import { Bot, ClipboardCheck, Globe2, LogIn, LogOut, Moon, PlusCircle, RefreshCw, Send, ShieldCheck, Sun, UserRound, Workflow } from "lucide-react";

import { api } from "./api";
import { appCopy } from "./appCopy";
import brandLogoLight from "../assets/logo.png";
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

const storageKey = "innovation-center-session";
const challengeRoles = ["admin", "innovation_director", "innovation_staff", "sector_owner"];
const reviewRoles = ["admin", "innovation_director", "innovation_staff", "innovation_expert"];
const challengeManagementRoles = ["admin", "innovation_director"];

function createChatMessage(role, content, extras = {}) {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content, ...extras };
}

function themeStyle(themeTokens, navColumns) {
  return {
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
    "--nav-columns": navColumns,
  };
}

function statusClassName(status) {
  return String(status || "submitted").replace(/_/g, "-");
}

export default function PlatformApp() {
  const [language, setLanguage] = useState("ar");
  const [theme, setTheme] = useState("dark");
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("home");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : { token: "", user: null };
    } catch {
      return { token: "", user: null };
    }
  });
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    accountType: "public_user",
  });
  const [dashboard, setDashboard] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [challengeDetails, setChallengeDetails] = useState(null);
  const [myIdeas, setMyIdeas] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [ideaEdits, setIdeaEdits] = useState({});
  const [userActions, setUserActions] = useState({});
  const [challengeManagerForm, setChallengeManagerForm] = useState({
    title: "",
    summary: "",
    scope: "",
    objectives: "",
    ownerDepartment: "",
  });
  const [selectedWinningIdeaId, setSelectedWinningIdeaId] = useState("");
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    summary: "",
    scope: "",
    objectives: "",
    ownerDepartment: "",
  });
  const [ideaForm, setIdeaForm] = useState({
    challengeId: "",
    title: "",
    summary: "",
    valueProposition: "",
    implementationPlan: "",
  });
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("idle");

  const text = appCopy[language];
  const themeTokens = themes[theme];
  const isArabic = language === "ar";
  const token = session.token;
  const user = session.user;
  const brandLogo = brandLogoLight;
  const canCreateChallenges = user ? challengeRoles.includes(user.role) : false;
  const canReviewIdeas = user ? reviewRoles.includes(user.role) : false;
  const canManageChallenges = user ? challengeManagementRoles.includes(user.role) : false;
  const isAdmin = user?.role === "admin";

  const navigation = useMemo(() => {
    if (!user) return [];
    return [
      ["home", text.nav.home, true],
      ["challenges", text.nav.challenges, true],
      ["submitIdea", text.nav.submitIdea, true],
      ["myIdeas", text.nav.myIdeas, true],
      ["chatbot", text.nav.chatbot, true],
      ["createChallenge", text.nav.createChallenge, canCreateChallenges],
      ["reviews", text.nav.reviews, canReviewIdeas],
      ["admin", text.nav.admin, isAdmin],
    ]
      .filter((item) => item[2])
      .map(([key, label]) => ({ key, label }));
  }, [user, text.nav, canCreateChallenges, canReviewIdeas, isAdmin]);

  useEffect(() => {
    document.documentElement.lang = text.meta.locale;
    document.documentElement.dir = text.meta.dir;
    document.body.style.background = themeTokens.bg;
    document.body.style.color = themeTokens.text;
  }, [text, themeTokens]);

  useEffect(() => {
    if (user) {
      setChatMessages([createChatMessage("assistant", text.chatbot.empty)]);
    }
  }, [user, text.chatbot.empty]);

  useEffect(() => {
    if (!token || !user) return;
    void refreshAll();
  }, [token, user]);

  useEffect(() => {
    if (!ideaForm.challengeId && challenges.length > 0) {
      setIdeaForm((current) => ({ ...current, challengeId: String(challenges[0].id) }));
    }
  }, [ideaForm.challengeId, challenges]);

  useEffect(() => {
    if (!token || !selectedChallengeId) return;
    let cancelled = false;

    void api
      .challengeDetails(token, selectedChallengeId)
      .then((payload) => {
        if (!cancelled) {
          setChallengeDetails(payload.challenge);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChallengeDetails(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChallengeId, token]);

  useEffect(() => {
    if (!challengeDetails) return;
    setChallengeManagerForm({
      title: challengeDetails.title || "",
      summary: challengeDetails.summary || "",
      scope: challengeDetails.scope || "",
      objectives: challengeDetails.objectives || "",
      ownerDepartment: challengeDetails.ownerDepartment || "",
    });
    setSelectedWinningIdeaId(challengeDetails.selectedIdeaId ? String(challengeDetails.selectedIdeaId) : "");
  }, [challengeDetails]);

  useEffect(() => {
    if (page !== "reviews" || !reviewQueue.length) return;
    const reviewableChallengeIds = new Set(reviewQueue.map((idea) => String(idea.challengeId)));
    if (!reviewableChallengeIds.has(String(selectedChallengeId))) {
      setSelectedChallengeId(String(reviewQueue[0].challengeId));
    }
  }, [page, reviewQueue, selectedChallengeId]);

  async function refreshAll() {
    try {
      setBusy("refresh");
      const [dashboardPayload, challengesPayload, myIdeasPayload, reviewPayload, adminPayload, notificationsPayload, usersPayload] = await Promise.all([
        api.dashboard(token),
        api.challenges(token),
        api.myIdeas(token),
        canReviewIdeas ? api.reviewQueue(token) : Promise.resolve({ ideas: [] }),
        isAdmin ? api.adminOverview(token) : Promise.resolve(null),
        api.notifications(token),
        isAdmin || user?.role === "innovation_director" ? api.users(token) : Promise.resolve({ users: [] }),
      ]);

      setDashboard(dashboardPayload);
      setChallenges(challengesPayload.challenges);
      setSelectedChallengeId((current) => {
        const nextChallenges = challengesPayload.challenges || [];
        if (!nextChallenges.length) return null;
        const currentStillExists = nextChallenges.some((challenge) => String(challenge.id) === String(current));
        return currentStillExists ? current : String(nextChallenges[0].id);
      });
      setMyIdeas(myIdeasPayload.ideas);
      setReviewQueue(reviewPayload?.ideas || []);
      setAdminData(adminPayload);
      setNotifications(notificationsPayload?.notifications || []);
      setManagedUsers(usersPayload?.users || []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load data." });
    } finally {
      setBusy("");
    }
  }

  function persistSession(nextSession) {
    setSession(nextSession);
    if (nextSession.token) {
      localStorage.setItem(storageKey, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      setBusy("auth");
      setNotice(null);
      const payload =
        authMode === "login"
          ? await api.login({ email: authForm.email, password: authForm.password })
          : await api.register(authForm);
      persistSession({ token: payload.token, user: payload.user });
      setPage("home");
      setAuthForm({ name: "", email: "", password: "", organization: "", accountType: "public_user" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Authentication failed." });
    } finally {
      setBusy("");
    }
  }

  function handleLogout() {
    persistSession({ token: "", user: null });
    setDashboard(null);
    setChallenges([]);
    setMyIdeas([]);
    setReviewQueue([]);
    setAdminData(null);
    setPage("home");
    setNotice(null);
  }

  async function handleCreateChallenge(event) {
    event.preventDefault();
    try {
      setBusy("createChallenge");
      await api.createChallenge(token, challengeForm);
      setChallengeForm({ title: "", summary: "", scope: "", objectives: "", ownerDepartment: "" });
      setNotice({ type: "success", text: isArabic ? "تم إنشاء التحدي بنجاح." : "Challenge created successfully." });
      await refreshAll();
      setPage("challenges");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to create challenge." });
    } finally {
      setBusy("");
    }
  }

  async function handleChallengeUpdate(event) {
    event.preventDefault();
    if (!selectedChallengeId) return;

    try {
      setBusy("updateChallenge");
      await api.updateChallenge(token, selectedChallengeId, challengeManagerForm);
      setNotice({ type: "success", text: isArabic ? "تم تحديث التحدي بنجاح." : "Challenge updated successfully." });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to update challenge." });
    } finally {
      setBusy("");
    }
  }

  async function handleChallengeDelete() {
    if (!selectedChallengeId) return;

    try {
      setBusy("deleteChallenge");
      await api.deleteChallenge(token, selectedChallengeId);
      setNotice({ type: "success", text: isArabic ? "تم حذف التحدي بنجاح." : "Challenge deleted successfully." });
      setSelectedChallengeId(null);
      setChallengeDetails(null);
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to delete challenge." });
    } finally {
      setBusy("");
    }
  }

  async function handleChallengeClose() {
    if (!selectedChallengeId || !selectedWinningIdeaId) {
      setNotice({
        type: "error",
        text: isArabic ? "يرجى اختيار فكرة لاعتمادها وإغلاق التحدي." : "Please select an idea before closing the challenge.",
      });
      return;
    }

    try {
      setBusy("closeChallenge");
      await api.closeChallenge(token, selectedChallengeId, { selectedIdeaId: Number(selectedWinningIdeaId) });
      setNotice({
        type: "success",
        text: isArabic ? "تم إغلاق التحدي واعتماد الفكرة المختارة." : "Challenge closed with the selected idea.",
      });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to close challenge." });
    } finally {
      setBusy("");
    }
  }

  async function handleSubmitIdea(event) {
    event.preventDefault();
    try {
      setBusy("submitIdea");
      await api.submitIdea(token, { ...ideaForm, challengeId: Number(ideaForm.challengeId) });
      setIdeaForm((current) => ({ ...current, title: "", summary: "", valueProposition: "", implementationPlan: "" }));
      setNotice({ type: "success", text: isArabic ? "تم إرسال الفكرة للمراجعة." : "Idea submitted for review." });
      await refreshAll();
      setPage("myIdeas");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to submit idea." });
    } finally {
      setBusy("");
    }
  }

  async function handleReviewSubmit(ideaId) {
    const draft = reviewDrafts[ideaId];
    if (!draft?.decision || !draft?.notes) {
      setNotice({ type: "error", text: isArabic ? "يرجى إدخال القرار والملاحظات." : "Please provide a decision and notes." });
      return;
    }
    try {
      setBusy(`review-${ideaId}`);
      await api.reviewIdea(token, ideaId, draft);
      setReviewDrafts((current) => ({ ...current, [ideaId]: { decision: "", notes: "" } }));
      setNotice({ type: "success", text: isArabic ? "تم حفظ المراجعة." : "Review saved successfully." });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to save review." });
    } finally {
      setBusy("");
    }
  }

  async function handleIdeaUpdate(ideaId) {
    const draft = ideaEdits[ideaId];
    if (!draft?.title || !draft?.summary || !draft?.valueProposition || !draft?.implementationPlan) {
      setNotice({ type: "error", text: isArabic ? "يرجى استكمال جميع حقول الفكرة قبل التحديث." : "Please complete all idea fields before updating." });
      return;
    }

    try {
      setBusy(`idea-${ideaId}`);
      await api.updateIdea(token, ideaId, draft);
      setNotice({ type: "success", text: isArabic ? "تم تحديث الفكرة وإشعار الجهة المراجعة." : "Idea updated and reviewers were notified." });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to update idea." });
    } finally {
      setBusy("");
    }
  }

  async function handleIdeaDelete(ideaId) {
    try {
      setBusy(`delete-idea-${ideaId}`);
      await api.deleteIdea(token, ideaId);
      setNotice({
        type: "success",
        text: isArabic ? "تم حذف الفكرة بنجاح." : "Idea deleted successfully.",
      });
      setIdeaEdits((current) => {
        const next = { ...current };
        delete next[ideaId];
        return next;
      });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to delete idea." });
    } finally {
      setBusy("");
    }
  }

  async function handleNotificationRead(notificationId) {
    try {
      await api.markNotificationRead(token, notificationId);
      setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
    } catch {
      // Keep UX light for notification taps.
    }
  }

  async function handleUserAction(action, userId) {
    const draft = userActions[userId] || {};

    try {
      setBusy(`${action}-${userId}`);

      if (action === "block") {
        await api.blockUser(token, userId, { reason: draft.reason || "Blocked by administrator." });
      }

      if (action === "unblock") {
        await api.unblockUser(token, userId);
      }

      if (action === "reset") {
        await api.resetUserPassword(token, userId, {
          newPassword: draft.newPassword || "TempPass123!",
        });
      }

      if (action === "delete") {
        await api.deleteUser(token, userId);
      }

      setNotice({
        type: "success",
        text: isArabic ? "تم تنفيذ الإجراء على المستخدم." : "User action completed successfully.",
      });
      await refreshAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to complete user action." });
    } finally {
      setBusy("");
    }
  }

  async function handleChatSubmission(submission) {
    if (!submission || submission.kind !== "idea") return;

    try {
      setBusy("chat-submit");
      await api.submitIdea(token, {
        challengeId: Number(submission.challengeId || selectedChallengeId || challenges[0]?.id),
        title: submission.title,
        summary: submission.summary || submission.detail,
        valueProposition: submission.valueProposition || submission.detail,
        implementationPlan: submission.implementationPlan || submission.detail,
      });
      setNotice({
        type: "success",
        text: isArabic ? "تم إرسال الفكرة المقترحة من المساعد." : "The chatbot-generated idea was submitted successfully.",
      });
      await refreshAll();
      setPage("myIdeas");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to submit chatbot idea." });
    } finally {
      setBusy("");
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    if (!chatInput.trim() || chatStatus === "loading") return;
    const message = chatInput.trim();
    setChatMessages((current) => [...current, createChatMessage("user", message)]);
    setChatInput("");
    setChatStatus("loading");
    try {
      const payload = await api.chat(token, { language, message });
      setChatMessages((current) => [...current, createChatMessage("assistant", payload.reply, { submission: payload.submission })]);
    } catch (error) {
      setChatMessages((current) => [...current, createChatMessage("assistant", error instanceof Error ? error.message : "Unable to generate a response.")]);
    } finally {
      setChatStatus("idle");
    }
  }

  async function translateIntoActiveLanguage(fields, onApply, busyKey) {
    try {
      setBusy(busyKey);
      const payload = await api.translate(token, {
        targetLanguage: language,
        fields,
      });
      onApply(payload.fields || {});
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to translate entries." });
    } finally {
      setBusy("");
    }
  }

  async function translateRecordStrings(record, fieldNames) {
    if (!record) return record;

    const fields = Object.fromEntries(
      fieldNames
        .filter((fieldName) => typeof record[fieldName] === "string" && record[fieldName].trim().length > 0)
        .map((fieldName) => [fieldName, record[fieldName]]),
    );

    if (!Object.keys(fields).length) {
      return record;
    }

    const payload = await api.translate(token, {
      targetLanguage: language,
      fields,
    });

    return {
      ...record,
      ...(payload.fields || {}),
    };
  }

  async function translateIdeaCollection(items = []) {
    return Promise.all(
      items.map(async (idea) => {
        const translatedIdea = await translateRecordStrings(idea, [
          "title",
          "summary",
          "valueProposition",
          "implementationPlan",
          "challengeTitle",
          "challengeSummary",
          "challengeScope",
          "challengeObjectives",
        ]);

        const translatedReviews = idea.reviews?.length
          ? await Promise.all(idea.reviews.map((review) => translateRecordStrings(review, ["notes"])))
          : idea.reviews;

        return {
          ...translatedIdea,
          reviews: translatedReviews,
        };
      }),
    );
  }

  async function translateChallengeCollection(items = []) {
    return Promise.all(
      items.map((challenge) =>
        translateRecordStrings(challenge, [
          "title",
          "summary",
          "scope",
          "objectives",
          "ownerDepartment",
          "selectedIdeaTitle",
        ]),
      ),
    );
  }

  async function translateVisibleContent() {
    try {
      setBusy("translate-content");

      const [translatedChallenges, translatedMyIdeas, translatedReviewQueue, translatedNotifications, translatedChallengeDetails] = await Promise.all([
        translateChallengeCollection(challenges),
        translateIdeaCollection(myIdeas),
        translateIdeaCollection(reviewQueue),
        Promise.all(notifications.map((notification) => translateRecordStrings(notification, ["title", "body"]))),
        challengeDetails
          ? (async () => {
              const translatedChallenge = await translateRecordStrings(challengeDetails, [
                "title",
                "summary",
                "scope",
                "objectives",
                "ownerDepartment",
                "selectedIdeaTitle",
              ]);

              return {
                ...translatedChallenge,
                ideas: await translateIdeaCollection(challengeDetails.ideas || []),
              };
            })()
          : Promise.resolve(null),
      ]);

      setChallenges(translatedChallenges);
      setMyIdeas(translatedMyIdeas);
      setReviewQueue(translatedReviewQueue);
      setNotifications(translatedNotifications);

      if (translatedChallengeDetails) {
        setChallengeDetails(translatedChallengeDetails);
      }

      setNotice({
        type: "success",
        text: isArabic ? "تمت ترجمة المحتوى الظاهر." : "Visible content was translated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : isArabic ? "تعذر ترجمة المحتوى." : "Unable to translate content.",
      });
    } finally {
      setBusy("");
    }
  }

  if (!user) {
    return (
      <AppShell brandLogo={brandLogo} navigation={[]} themeStyle={themeStyle(themeTokens, 2)} backgroundMotif={backgroundMotif}>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="topbar-main-row">
              <BrandBlock logo={brandLogo} />
              <div className="utility-actions">
                <UtilityButton icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} label={theme === "dark" ? text.meta.switchThemeLight : text.meta.switchThemeDark} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
                <UtilityButton icon={<Globe2 size={16} />} label={text.meta.switchLanguage} onClick={() => setLanguage(isArabic ? "en" : "ar")} />
              </div>
            </div>
          </div>
        </header>
        <main className="content-shell">
          <div className="auth-layout">
            <section className="hero-card auth-hero">
              <div className="hero-copy">
                <div className="eyebrow">{text.brand.login}</div>
                <h1>{text.auth.title}</h1>
                <p>{text.auth.subtitle}</p>
                <div className="hero-footnote">{text.auth.publicHint}</div>
              </div>
              <div className="hero-side">
                <div className="hero-highlight"><ShieldCheck size={18} /><span>{text.auth.demoTitle}</span></div>
                <p className="auth-side-note">{text.auth.demoSubtitle}</p>
                <div className="demo-account-list">
                  {demoAccounts(text).map((account) => (
                    <div key={account.email} className="demo-account-card">
                      <strong>{account.role}</strong>
                      <span>{account.email}</span>
                      <code>{account.password}</code>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="panel-card auth-panel">
              <div className="auth-tab-row">
                <TabButton active={authMode === "login"} label={text.auth.loginTab} onClick={() => setAuthMode("login")} />
                <TabButton active={authMode === "register"} label={text.auth.registerTab} onClick={() => setAuthMode("register")} />
              </div>
              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {notice && <NoticeBanner notice={notice} />}
                {authMode === "register" && (
                  <>
                    <Field label={text.auth.name} value={authForm.name} onChange={(value) => setAuthForm((current) => ({ ...current, name: value }))} />
                    <Field label={text.auth.organization} value={authForm.organization} onChange={(value) => setAuthForm((current) => ({ ...current, organization: value }))} />
                  </>
                )}
                <Field label={text.auth.email} type="email" value={authForm.email} onChange={(value) => setAuthForm((current) => ({ ...current, email: value }))} />
                <Field label={text.auth.password} type="password" value={authForm.password} onChange={(value) => setAuthForm((current) => ({ ...current, password: value }))} />
                {authMode === "register" && (
                  <SelectField
                    label={text.auth.accountType}
                    value={authForm.accountType}
                    onChange={(value) => setAuthForm((current) => ({ ...current, accountType: value }))}
                    options={[
                      { value: "public_user", label: text.auth.publicUser },
                      { value: "partner_entity", label: text.auth.partnerEntity },
                    ]}
                  />
                )}
                <button type="submit" className="primary-button block-button" disabled={busy === "auth"}>
                  <LogIn size={18} />
                  {authMode === "login" ? text.auth.submitLogin : text.auth.submitRegister}
                </button>
              </form>
            </section>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell brandLogo={brandLogo} navigation={navigation} themeStyle={themeStyle(themeTokens, navigation.length)} backgroundMotif={backgroundMotif}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-main-row">
            <BrandBlock logo={brandLogo} />
            <div className="utility-actions">
              <span className="role-chip">{text.roles[user.role]}</span>
              <UtilityButton
                icon={<Globe2 size={16} />}
                label={isArabic ? "ترجمة المحتوى" : "Translate Content"}
                onClick={translateVisibleContent}
              />
              <UtilityButton icon={<RefreshCw size={16} />} label={text.actions.refresh} onClick={refreshAll} />
              <UtilityButton icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} label={theme === "dark" ? text.meta.switchThemeLight : text.meta.switchThemeDark} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
              <UtilityButton icon={<Globe2 size={16} />} label={text.meta.switchLanguage} onClick={() => setLanguage(isArabic ? "en" : "ar")} />
              <button type="button" className="login-button" onClick={handleLogout} aria-label={text.brand.logout}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <nav className="nav-strip" aria-label="Primary">
            {navigation.map((item) => (
              <button key={item.key} type="button" className={`nav-button ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="content-shell">
        {notice && <NoticeBanner notice={notice} />}
        {page === "home" && <HomePage dashboard={dashboard} text={text} user={user} canCreateChallenges={canCreateChallenges} canReviewIdeas={canReviewIdeas} notifications={notifications} onNotificationRead={handleNotificationRead} />}
        {page === "challenges" && (
          <ChallengesPage
            challenges={challenges}
            text={text}
            selectedChallengeId={selectedChallengeId}
            setSelectedChallengeId={setSelectedChallengeId}
            challengeDetails={challengeDetails}
            canManageChallenges={canManageChallenges}
            challengeManagerForm={challengeManagerForm}
            setChallengeManagerForm={setChallengeManagerForm}
            selectedWinningIdeaId={selectedWinningIdeaId}
            setSelectedWinningIdeaId={setSelectedWinningIdeaId}
            busy={busy}
            onChallengeUpdate={handleChallengeUpdate}
            onChallengeDelete={handleChallengeDelete}
            onChallengeClose={handleChallengeClose}
            roleLabels={text.roles}
            statusLabels={text.status}
            isArabic={isArabic}
            onTranslateChallengeManager={() =>
              translateIntoActiveLanguage(
                {
                  title: challengeManagerForm.title,
                  summary: challengeManagerForm.summary,
                  scope: challengeManagerForm.scope,
                  objectives: challengeManagerForm.objectives,
                  ownerDepartment: challengeManagerForm.ownerDepartment,
                },
                (translated) => setChallengeManagerForm((current) => ({ ...current, ...translated })),
                "translate-manage-challenge",
              )
            }
          />
        )}
        {page === "submitIdea" && <SubmitIdeaPage text={text} challenges={challenges} ideaForm={ideaForm} setIdeaForm={setIdeaForm} busy={busy} onSubmit={handleSubmitIdea} onTranslate={() => translateIntoActiveLanguage({ title: ideaForm.title, summary: ideaForm.summary, valueProposition: ideaForm.valueProposition, implementationPlan: ideaForm.implementationPlan }, (translated) => setIdeaForm((current) => ({ ...current, ...translated })), "translate-submit-idea")} />}
        {page === "createChallenge" && canCreateChallenges && <CreateChallengePage text={text} challengeForm={challengeForm} setChallengeForm={setChallengeForm} busy={busy} onSubmit={handleCreateChallenge} onTranslate={() => translateIntoActiveLanguage({ title: challengeForm.title, summary: challengeForm.summary, scope: challengeForm.scope, objectives: challengeForm.objectives, ownerDepartment: challengeForm.ownerDepartment }, (translated) => setChallengeForm((current) => ({ ...current, ...translated })), "translate-create-challenge")} />}
        {page === "myIdeas" && <MyIdeasPage text={text} ideas={myIdeas} ideaEdits={ideaEdits} setIdeaEdits={setIdeaEdits} busy={busy} onIdeaUpdate={handleIdeaUpdate} onIdeaDelete={handleIdeaDelete} roleLabels={text.roles} statusLabels={text.status} isArabic={isArabic} onTranslateIdea={(ideaId, fields) => translateIntoActiveLanguage(fields, (translated) => setIdeaEdits((current) => ({ ...current, [ideaId]: { ...current[ideaId], ...translated } })), `translate-idea-${ideaId}`)} />}
        {page === "reviews" && canReviewIdeas && (
          <ReviewsPage
            text={text}
            challenges={challenges}
            selectedChallengeId={selectedChallengeId}
            setSelectedChallengeId={setSelectedChallengeId}
            challengeDetails={challengeDetails}
            reviewQueue={reviewQueue}
            reviewDrafts={reviewDrafts}
            setReviewDrafts={setReviewDrafts}
            busy={busy}
            onSubmit={handleReviewSubmit}
            roleLabels={text.roles}
            statusLabels={text.status}
            isArabic={isArabic}
          />
        )}
        {page === "admin" && isAdmin && <AdminPage text={text} adminData={adminData} managedUsers={managedUsers} userActions={userActions} setUserActions={setUserActions} busy={busy} onUserAction={handleUserAction} />}
        {page === "chatbot" && <ChatbotPage text={text} user={user} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} chatStatus={chatStatus} onSubmit={handleChatSubmit} challenges={challenges} onChatSubmission={handleChatSubmission} />}
      </main>
    </AppShell>
  );
}

function AppShell({ children, themeStyle: style, backgroundMotif }) {
  return (
    <div className="app-shell" style={style}>
      <div className="app-motif" aria-hidden="true">
        <img src={backgroundMotif} alt="" />
      </div>
      <div className="page-glow page-glow-one" />
      <div className="page-glow page-glow-two" />
      {children}
    </div>
  );
}

function BrandBlock({ logo }) {
  return (
    <div className="brand-block brand-block-rich">
      <img className="brand-logo" src={logo} alt="Ministry of Municipalities and Housing" />
    </div>
  );
}

function UtilityButton({ icon, label, onClick }) {
  return (
    <button type="button" className="utility-button" onClick={onClick}>
      {icon}
      <span className="utility-label">{label}</span>
    </button>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button type="button" className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function NoticeBanner({ notice }) {
  return <div className={`notice-banner ${notice.type}`}>{notice.text}</div>;
}

function InfoCard({ value, label }) {
  return (
    <article className="info-card">
      <strong>{value || 0}</strong>
      <span>{label}</span>
    </article>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows="4" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ label, status }) {
  return <span className={`status-pill status-${statusClassName(status)}`}>{label}</span>;
}

function ChallengeMetaItem({ label, value }) {
  return (
    <div className="challenge-meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function HomePage({ dashboard, text, user, canCreateChallenges, canReviewIdeas, notifications, onNotificationRead }) {
  return (
    <>
      <SectionHeader title={text.brand.subtitle} subtitle="" />
      <div className="stats-grid">
        <InfoCard value={dashboard?.counts.challengeCount} label={text.home.cards.challenges} />
        <InfoCard value={dashboard?.counts.ideaCount} label={text.home.cards.ideas} />
        <InfoCard value={dashboard?.counts.reviewCount} label={text.home.cards.reviews} />
        <InfoCard value={dashboard?.counts.pendingIdeas} label={text.home.cards.pending} />
      </div>
      <div className="detail-layout">
        <article className="panel-card">
          <h3>{`${text.messages.welcome} ${user.name}`}</h3>
          <p>{user.email}</p>
          <div className="bullet-list padded-top">
            <div className="list-row"><UserRound size={18} /><span>{text.roles[user.role]}</span></div>
            <div className="list-row"><ShieldCheck size={18} /><span>{user.organization || "-"}</span></div>
            {canCreateChallenges && <div className="list-row"><PlusCircle size={18} /><span>{text.createChallenge.subtitle}</span></div>}
            {canReviewIdeas && <div className="list-row"><ClipboardCheck size={18} /><span>{text.reviews.subtitle}</span></div>}
          </div>
        </article>
        <aside className="side-column">
          <div className="panel-card">
            <h3>{text.home.recentIdeas}</h3>
            {dashboard?.recentIdeas?.length ? (
              <div className="activity-list">
                {dashboard.recentIdeas.map((idea) => (
                  <div key={idea.id} className="activity-row">
                    <strong>{idea.title}</strong>
                    <span>{idea.challengeTitle}</span>
                    <StatusPill label={text.status[idea.status] || idea.status} status={idea.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p>{text.home.noIdeas}</p>
            )}
          </div>
          <div className="panel-card">
            <h3>{text.nav.chatbot === "المساعد الذكي" ? "الإشعارات" : "Notifications"}</h3>
            {notifications?.length ? (
              <div className="activity-list">
                {notifications.map((notification) => (
                  <button key={notification.id} type="button" className={`activity-row notification-row ${notification.isRead ? "read" : "unread"}`} onClick={() => onNotificationRead(notification.id)}>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p>{text.home.noIdeas}</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function LegacyChallengesPage({ challenges, text, selectedChallengeId, setSelectedChallengeId, challengeDetails }) {
  return (
    <>
      <SectionHeader title={text.challenges.title} subtitle={text.challenges.subtitle} />
      <div className="admin-layout challenge-detail-layout">
        <article className="stack-list">
          {challenges.map((challenge) => (
            <button key={challenge.id} type="button" className={`challenge-card challenge-select-card ${String(challenge.id) === String(selectedChallengeId) ? "selected-card" : ""}`} onClick={() => setSelectedChallengeId(String(challenge.id))}>
            <div className="challenge-top">
              <StatusPill label={text.status[challenge.status] || challenge.status} status={challenge.status} />
              <span className="challenge-ideas">{challenge.ideaCount} {text.challenges.ideaCount}</span>
            </div>
            <h3>{challenge.title}</h3>
            <p>{challenge.summary}</p>
            <dl className="challenge-meta">
              <ChallengeMetaItem label={text.challenges.owner} value={challenge.ownerDepartment} />
              <ChallengeMetaItem label={text.challenges.createdBy} value={challenge.createdBy} />
            </dl>
            <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{challenge.scope}</p></div>
            <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{challenge.objectives}</p></div>
            </button>
          ))}
        </article>
        <aside className="side-column">
          {challengeDetails ? (
            <div className="panel-card">
              <h3>{challengeDetails.title}</h3>
              <p>{challengeDetails.summary}</p>
              <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{challengeDetails.scope}</p></div>
              <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{challengeDetails.objectives}</p></div>
              <div className="activity-list">
                {challengeDetails.ideas?.map((idea) => (
                  <div key={idea.id} className="activity-row">
                    <strong>{idea.title}</strong>
                    <span>{idea.submitterName} · {idea.submitterEmail}</span>
                    <span>{idea.submitterOrganization || "-"}</span>
                    <StatusPill label={text.status[idea.status] || idea.status} status={idea.status} />
                  </div>
                )) || <p>{text.myIdeas.empty}</p>}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function SubmitIdeaPage({ text, challenges, ideaForm, setIdeaForm, busy, onSubmit, onTranslate }) {
  return (
    <>
      <SectionHeader title={text.submitIdea.title} subtitle={text.submitIdea.subtitle} />
      <div className="form-layout">
        <form className="panel-card form-card" onSubmit={onSubmit}>
          <div className="hero-actions">
            <button type="button" className="secondary-button" disabled={busy === "translate-submit-idea"} onClick={onTranslate}>
              <Globe2 size={18} />
              {text.actions.translateEntries}
            </button>
          </div>
          <SelectField label={text.submitIdea.challenge} value={ideaForm.challengeId} onChange={(value) => setIdeaForm((current) => ({ ...current, challengeId: value }))} options={challenges.map((challenge) => ({ value: String(challenge.id), label: challenge.title }))} />
          <Field label={text.submitIdea.titleField} value={ideaForm.title} onChange={(value) => setIdeaForm((current) => ({ ...current, title: value }))} />
          <TextAreaField label={text.submitIdea.summary} value={ideaForm.summary} onChange={(value) => setIdeaForm((current) => ({ ...current, summary: value }))} />
          <TextAreaField label={text.submitIdea.value} value={ideaForm.valueProposition} onChange={(value) => setIdeaForm((current) => ({ ...current, valueProposition: value }))} />
          <TextAreaField label={text.submitIdea.plan} value={ideaForm.implementationPlan} onChange={(value) => setIdeaForm((current) => ({ ...current, implementationPlan: value }))} />
          <button type="submit" className="primary-button submit-button" disabled={busy === "submitIdea"}>
            <Send size={18} />
            {text.submitIdea.submit}
          </button>
        </form>
        <aside className="side-column">
          <div className="panel-card">
            <h3>{text.challenges.title}</h3>
            <div className="activity-list">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="activity-row compact-activity">
                  <strong>{challenge.title}</strong>
                  <span>{challenge.ownerDepartment}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function CreateChallengePage({ text, challengeForm, setChallengeForm, busy, onSubmit, onTranslate }) {
  return (
    <>
      <SectionHeader title={text.createChallenge.title} subtitle={text.createChallenge.subtitle} />
      <form className="panel-card form-card" onSubmit={onSubmit}>
        <div className="hero-actions">
          <button type="button" className="secondary-button" disabled={busy === "translate-create-challenge"} onClick={onTranslate}>
            <Globe2 size={18} />
            {text.actions.translateEntries}
          </button>
        </div>
        <Field label={text.createChallenge.challengeTitle} value={challengeForm.title} onChange={(value) => setChallengeForm((current) => ({ ...current, title: value }))} />
        <TextAreaField label={text.createChallenge.summary} value={challengeForm.summary} onChange={(value) => setChallengeForm((current) => ({ ...current, summary: value }))} />
        <TextAreaField label={text.createChallenge.scope} value={challengeForm.scope} onChange={(value) => setChallengeForm((current) => ({ ...current, scope: value }))} />
        <TextAreaField label={text.createChallenge.objectives} value={challengeForm.objectives} onChange={(value) => setChallengeForm((current) => ({ ...current, objectives: value }))} />
        <Field label={text.createChallenge.ownerDepartment} value={challengeForm.ownerDepartment} onChange={(value) => setChallengeForm((current) => ({ ...current, ownerDepartment: value }))} />
        <button type="submit" className="primary-button submit-button" disabled={busy === "createChallenge"}>
          <PlusCircle size={18} />
          {text.createChallenge.submit}
        </button>
      </form>
    </>
  );
}

function LegacyMyIdeasPage({ text, ideas, ideaEdits, setIdeaEdits, busy, onIdeaUpdate }) {
  return (
    <>
      <SectionHeader title={text.myIdeas.title} subtitle={text.myIdeas.subtitle} />
      <div className="stack-list">
        {ideas.length === 0 ? (
          <div className="panel-card empty-panel"><p>{text.myIdeas.empty}</p></div>
        ) : (
          ideas.map((idea) => (
            <div key={idea.id} className="panel-card">
              <div className="challenge-top">
                <h3>{idea.title}</h3>
                <StatusPill label={text.status[idea.status] || idea.status} status={idea.status} />
              </div>
              <p>{idea.challengeTitle}</p>
              <div className="form-grid review-form-grid">
                <Field label={text.submitIdea.titleField} value={ideaEdits[idea.id]?.title ?? idea.title} onChange={(value) => setIdeaEdits((current) => ({ ...current, [idea.id]: { ...idea, ...current[idea.id], title: value } }))} />
                <TextAreaField label={text.submitIdea.summary} value={ideaEdits[idea.id]?.summary ?? idea.summary} onChange={(value) => setIdeaEdits((current) => ({ ...current, [idea.id]: { ...idea, ...current[idea.id], summary: value } }))} />
                <TextAreaField label={text.submitIdea.value} value={ideaEdits[idea.id]?.valueProposition ?? idea.valueProposition} onChange={(value) => setIdeaEdits((current) => ({ ...current, [idea.id]: { ...idea, ...current[idea.id], valueProposition: value } }))} />
                <TextAreaField label={text.submitIdea.plan} value={ideaEdits[idea.id]?.implementationPlan ?? idea.implementationPlan} onChange={(value) => setIdeaEdits((current) => ({ ...current, [idea.id]: { ...idea, ...current[idea.id], implementationPlan: value } }))} />
              </div>
              <div className="activity-row compact-activity">
                <span>{idea.updatedAt || idea.createdAt}</span>
              </div>
              <button type="button" className="primary-button" disabled={busy === `idea-${idea.id}`} onClick={() => onIdeaUpdate(idea.id)}>
                <RefreshCw size={18} />
                {text.actions.updateIdea}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function LegacyReviewsPage({ text, reviewQueue, reviewDrafts, setReviewDrafts, busy, onSubmit }) {
  return (
    <>
      <SectionHeader title={text.reviews.title} subtitle={text.reviews.subtitle} />
      <div className="stack-list">
        {reviewQueue.length === 0 ? (
          <div className="panel-card empty-panel"><p>{text.reviews.empty}</p></div>
        ) : (
          reviewQueue.map((idea) => (
            <div key={idea.id} className="panel-card review-card">
              <div className="challenge-top">
                <div><h3>{idea.title}</h3><p>{idea.challengeTitle}</p></div>
                <StatusPill label={text.status[idea.status] || idea.status} status={idea.status} />
              </div>
              <div className="bullet-list review-meta">
                <div className="list-row"><Workflow size={18} /><span>{idea.summary}</span></div>
                <div className="list-row"><Workflow size={18} /><span>{idea.valueProposition}</span></div>
                <div className="list-row"><ShieldCheck size={18} /><span>{idea.implementationPlan}</span></div>
              </div>
              <div className="form-grid review-form-grid">
                <SelectField
                  label={text.reviews.decision}
                  value={reviewDrafts[idea.id]?.decision || ""}
                  onChange={(value) => setReviewDrafts((current) => ({ ...current, [idea.id]: { decision: value, notes: current[idea.id]?.notes || "" } }))}
                  options={[
                    { value: "", label: text.reviews.decision },
                    { value: "approve", label: text.reviews.approve },
                    { value: "pilot", label: text.reviews.pilot },
                    { value: "revise", label: text.reviews.revise },
                    { value: "reject", label: text.reviews.reject },
                  ]}
                />
                <TextAreaField
                  label={text.reviews.notes}
                  value={reviewDrafts[idea.id]?.notes || ""}
                  onChange={(value) => setReviewDrafts((current) => ({ ...current, [idea.id]: { decision: current[idea.id]?.decision || "", notes: value } }))}
                />
              </div>
              <button type="button" className="primary-button" disabled={busy === `review-${idea.id}`} onClick={() => onSubmit(idea.id)}>
                <ClipboardCheck size={18} />
                {text.reviews.submit}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function MyIdeasPage({ text, ideas, ideaEdits, setIdeaEdits, busy, onIdeaUpdate, onIdeaDelete, roleLabels, statusLabels, isArabic, onTranslateIdea }) {
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const selectedIdea = ideas.find((idea) => String(idea.id) === String(selectedIdeaId)) || ideas[0] || null;

  useEffect(() => {
    if (!selectedIdea) {
      setSelectedIdeaId("");
      return;
    }
    setSelectedIdeaId((current) => (String(current) === String(selectedIdea.id) ? current : String(selectedIdea.id)));
  }, [selectedIdea?.id]);

  return (
    <>
      <SectionHeader title={text.myIdeas.title} subtitle={text.myIdeas.subtitle} />
      <div className="workspace-stack">
        {ideas.length === 0 ? (
          <div className="panel-card empty-panel"><p>{text.myIdeas.empty}</p></div>
        ) : (
          <>
            <div className="panel-card selection-panel">
              <h3>{isArabic ? "اختيار الفكرة" : "Select Idea"}</h3>
              <div className="stack-list">
                {ideas.map((idea) => (
                  <button key={idea.id} type="button" className={`activity-row selection-summary-card review-idea-button ${String(idea.id) === String(selectedIdea?.id) ? "selected-card" : ""}`} onClick={() => setSelectedIdeaId(String(idea.id))}>
                    <div className="challenge-top">
                      <strong>{idea.title}</strong>
                      <StatusPill label={statusLabels[idea.status] || idea.status} status={idea.status} />
                    </div>
                    <span>{idea.challengeTitle}</span>
                    <span>{idea.updatedAt || idea.createdAt}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedIdea ? (
              <>
                <div className="section-break" />
                <div className="panel-card review-workspace-panel">
                  <div className="challenge-top">
                    <div>
                      <div className="eyebrow">{isArabic ? "تفاصيل الفكرة" : "Idea Workspace"}</div>
                      <h3>{selectedIdea.title}</h3>
                      <p>{selectedIdea.challengeTitle}</p>
                    </div>
                    <StatusPill label={statusLabels[selectedIdea.status] || selectedIdea.status} status={selectedIdea.status} />
                  </div>
                  <div className="detail-block compact-block">
                    <h3>{isArabic ? "التحدي" : "Challenge"}</h3>
                    <p>{selectedIdea.challengeSummary}</p>
                  </div>
                  <div className="review-row-grid">
                    <div className="detail-block compact-block">
                      <h3>{isArabic ? "نطاق التحدي" : "Challenge Scope"}</h3>
                      <p>{selectedIdea.challengeScope}</p>
                    </div>
                    <div className="detail-block compact-block">
                      <h3>{isArabic ? "أهداف التحدي" : "Challenge Objectives"}</h3>
                      <p>{selectedIdea.challengeObjectives}</p>
                    </div>
                  </div>
                  <div className="selection-divider" />
                  <div className="form-grid review-form-grid my-idea-grid">
                    <Field label={text.submitIdea.titleField} value={ideaEdits[selectedIdea.id]?.title ?? selectedIdea.title} onChange={(value) => setIdeaEdits((current) => ({ ...current, [selectedIdea.id]: { ...selectedIdea, ...current[selectedIdea.id], title: value } }))} />
                    <TextAreaField label={text.submitIdea.summary} value={ideaEdits[selectedIdea.id]?.summary ?? selectedIdea.summary} onChange={(value) => setIdeaEdits((current) => ({ ...current, [selectedIdea.id]: { ...selectedIdea, ...current[selectedIdea.id], summary: value } }))} />
                    <TextAreaField label={text.submitIdea.value} value={ideaEdits[selectedIdea.id]?.valueProposition ?? selectedIdea.valueProposition} onChange={(value) => setIdeaEdits((current) => ({ ...current, [selectedIdea.id]: { ...selectedIdea, ...current[selectedIdea.id], valueProposition: value } }))} />
                    <TextAreaField label={text.submitIdea.plan} value={ideaEdits[selectedIdea.id]?.implementationPlan ?? selectedIdea.implementationPlan} onChange={(value) => setIdeaEdits((current) => ({ ...current, [selectedIdea.id]: { ...selectedIdea, ...current[selectedIdea.id], implementationPlan: value } }))} />
                  </div>
                  <div className="hero-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busy === `translate-idea-${selectedIdea.id}`}
                      onClick={() =>
                        onTranslateIdea(selectedIdea.id, {
                          title: ideaEdits[selectedIdea.id]?.title ?? selectedIdea.title,
                          summary: ideaEdits[selectedIdea.id]?.summary ?? selectedIdea.summary,
                          valueProposition: ideaEdits[selectedIdea.id]?.valueProposition ?? selectedIdea.valueProposition,
                          implementationPlan: ideaEdits[selectedIdea.id]?.implementationPlan ?? selectedIdea.implementationPlan,
                        })
                      }
                    >
                      <Globe2 size={18} />
                      {text.actions.translateEntries}
                    </button>
                  </div>
                  <div className="detail-block compact-block">
                    <h3>{isArabic ? "سجل المراجعات" : "Review History"}</h3>
                    {selectedIdea.reviews?.length ? (
                      <div className="activity-list">
                        {selectedIdea.reviews.map((review) => (
                          <div key={review.id} className="activity-row compact-activity">
                            <strong>{statusLabels[review.decision === "pilot" ? "pilot_ready" : review.decision === "approve" ? "approved" : review.decision === "reject" ? "rejected" : "revision_requested"] || review.decision}</strong>
                            <span>{review.reviewerName} · {roleLabels[review.reviewerRole] || review.reviewerRole}</span>
                            <span>{review.notes}</span>
                            <span>{review.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{isArabic ? "لا توجد مراجعات بعد." : "No reviews yet."}</p>
                    )}
                  </div>
                  <div className="activity-row compact-activity">
                    <span>{selectedIdea.updatedAt || selectedIdea.createdAt}</span>
                  </div>
                  <div className="hero-actions">
                    <button type="button" className="primary-button" disabled={busy === `idea-${selectedIdea.id}`} onClick={() => onIdeaUpdate(selectedIdea.id)}>
                      <RefreshCw size={18} />
                      {text.actions.updateIdea}
                    </button>
                    <button type="button" className="secondary-button danger-button" disabled={busy === `delete-idea-${selectedIdea.id}` || selectedIdea.challengeStatus !== "open"} onClick={() => onIdeaDelete(selectedIdea.id)}>
                      {isArabic ? "حذف الفكرة" : "Delete Idea"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function ChallengeIdeaCard({ idea, statusLabels, roleLabels, isArabic }) {
  return (
    <div className="activity-row idea-summary-card">
      <div className="challenge-top">
        <strong>{idea.title}</strong>
        <StatusPill label={statusLabels[idea.status] || idea.status} status={idea.status} />
      </div>
      <span>{idea.submitterName} · {idea.submitterEmail}</span>
      <span>{idea.submitterOrganization || "-"}</span>
      <span>{roleLabels[idea.submitterRole] || idea.submitterRole}</span>
      {idea.reviews?.length ? <span>{isArabic ? `عدد المراجعات: ${idea.reviews.length}` : `Reviews: ${idea.reviews.length}`}</span> : null}
    </div>
  );
}

function LegacyChallengesPageStructured({
  challenges,
  text,
  selectedChallengeId,
  setSelectedChallengeId,
  challengeDetails,
  canManageChallenges,
  challengeManagerForm,
  setChallengeManagerForm,
  selectedWinningIdeaId,
  setSelectedWinningIdeaId,
  busy,
  onChallengeUpdate,
  onChallengeDelete,
  onChallengeClose,
  roleLabels,
  statusLabels,
  isArabic,
  onTranslateChallengeManager,
}) {
  return (
    <>
      <SectionHeader title={text.challenges.title} subtitle={text.challenges.subtitle} />
      <div className="workspace-stack">
        <div className="panel-card">
          <h3>{isArabic ? "قائمة التحديات" : "Challenge List"}</h3>
          <div className="stack-list">
            {challenges.map((challenge) => (
              <button key={challenge.id} type="button" className={`challenge-card challenge-select-card ${String(challenge.id) === String(selectedChallengeId) ? "selected-card" : ""}`} onClick={() => setSelectedChallengeId(String(challenge.id))}>
                <div className="challenge-top">
                  <StatusPill label={statusLabels[challenge.status] || challenge.status} status={challenge.status} />
                  <span className="challenge-ideas">{challenge.ideaCount} {text.challenges.ideaCount}</span>
                </div>
                <h3>{challenge.title}</h3>
                <p>{challenge.summary}</p>
                <dl className="challenge-meta">
                  <ChallengeMetaItem label={text.challenges.owner} value={challenge.ownerDepartment} />
                  <ChallengeMetaItem label={text.challenges.createdBy} value={challenge.createdBy} />
                </dl>
              </button>
            ))}
          </div>
        </div>
        {challengeDetails ? (
          <>
            <div className="panel-card">
              <div className="challenge-top">
                <div>
                  <h3>{challengeDetails.title}</h3>
                  <p>{challengeDetails.summary}</p>
                </div>
                <StatusPill label={statusLabels[challengeDetails.status] || challengeDetails.status} status={challengeDetails.status} />
              </div>
              <dl className="challenge-meta">
                <ChallengeMetaItem label={text.challenges.owner} value={challengeDetails.ownerDepartment} />
                <ChallengeMetaItem label={text.challenges.createdBy} value={`${challengeDetails.createdBy} · ${challengeDetails.creatorEmail}`} />
              </dl>
              <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{challengeDetails.scope}</p></div>
              <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{challengeDetails.objectives}</p></div>
              {challengeDetails.selectedIdeaTitle ? (
                <div className="detail-block compact-block selected-idea-banner">
                  <h3>{isArabic ? "الفكرة المعتمدة" : "Selected Idea"}</h3>
                  <p>{challengeDetails.selectedIdeaTitle}</p>
                </div>
              ) : null}
            </div>
            <div className="panel-card">
              <h3>{isArabic ? "الأفكار المرتبطة بالتحدي" : "Ideas For This Challenge"}</h3>
              {challengeDetails.ideas?.length ? (
                <div className="stack-list">
                  {challengeDetails.ideas.map((idea) => (
                    <ChallengeIdeaCard key={idea.id} idea={idea} statusLabels={statusLabels} roleLabels={roleLabels} isArabic={isArabic} />
                  ))}
                </div>
              ) : (
                <p>{text.myIdeas.empty}</p>
              )}
            </div>
            {canManageChallenges ? (
              <div className="panel-card">
                <h3>{isArabic ? "إدارة التحدي" : "Manage Challenge"}</h3>
                <form className="form-card" onSubmit={onChallengeUpdate}>
                  <div className="hero-actions">
                    <button type="button" className="secondary-button" disabled={busy === "translate-manage-challenge"} onClick={onTranslateChallengeManager}>
                      <Globe2 size={18} />
                      {text.actions.translateEntries}
                    </button>
                  </div>
                  <Field label={text.createChallenge.challengeTitle} value={challengeManagerForm.title} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, title: value }))} />
                  <TextAreaField label={text.createChallenge.summary} value={challengeManagerForm.summary} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, summary: value }))} />
                  <TextAreaField label={text.createChallenge.scope} value={challengeManagerForm.scope} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, scope: value }))} />
                  <TextAreaField label={text.createChallenge.objectives} value={challengeManagerForm.objectives} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, objectives: value }))} />
                  <Field label={text.createChallenge.ownerDepartment} value={challengeManagerForm.ownerDepartment} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, ownerDepartment: value }))} />
                  <div className="hero-actions">
                    <button type="submit" className="primary-button" disabled={busy === "updateChallenge"}>
                      <RefreshCw size={18} />
                      {isArabic ? "حفظ التعديلات" : "Save Changes"}
                    </button>
                    <button type="button" className="secondary-button danger-button" disabled={busy === "deleteChallenge"} onClick={onChallengeDelete}>
                      {isArabic ? "حذف التحدي" : "Delete Challenge"}
                    </button>
                  </div>
                </form>
                <div className="detail-block compact-block challenge-close-block">
                  <h3>{isArabic ? "إغلاق التحدي بفكرة معتمدة" : "Close Challenge With Selected Idea"}</h3>
                  <SelectField
                    label={isArabic ? "الفكرة المعتمدة" : "Selected Idea"}
                    value={selectedWinningIdeaId}
                    onChange={setSelectedWinningIdeaId}
                    options={[
                      { value: "", label: isArabic ? "اختر فكرة" : "Choose an idea" },
                      ...(challengeDetails.ideas || []).map((idea) => ({ value: String(idea.id), label: `${idea.title} · ${idea.submitterName}` })),
                    ]}
                  />
                  <button type="button" className="primary-button block-button" disabled={busy === "closeChallenge" || !challengeDetails.ideas?.length} onClick={onChallengeClose}>
                    <ShieldCheck size={18} />
                    {isArabic ? "اعتماد الفكرة وإغلاق التحدي" : "Select Idea And Close Challenge"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}

function ChallengesPage({
  challenges,
  text,
  selectedChallengeId,
  setSelectedChallengeId,
  challengeDetails,
  canManageChallenges,
  challengeManagerForm,
  setChallengeManagerForm,
  selectedWinningIdeaId,
  setSelectedWinningIdeaId,
  busy,
  onChallengeUpdate,
  onChallengeDelete,
  onChallengeClose,
  onTranslateChallengeManager,
  roleLabels,
  statusLabels,
  isArabic,
}) {
  return (
    <>
      <SectionHeader title={text.challenges.title} subtitle={text.challenges.subtitle} />
      <div className="workspace-stack">
        <div className="panel-card selection-panel">
          <h3>{isArabic ? "اختيار التحدي" : "Select Challenge"}</h3>
          <div className="stack-list">
            {challenges.map((challenge) => (
              <button key={challenge.id} type="button" className={`activity-row selection-summary-card review-idea-button ${String(challenge.id) === String(selectedChallengeId) ? "selected-card" : ""}`} onClick={() => setSelectedChallengeId(String(challenge.id))}>
                <div className="challenge-top">
                  <strong>{challenge.title}</strong>
                  <StatusPill label={statusLabels[challenge.status] || challenge.status} status={challenge.status} />
                </div>
                <span>{challenge.summary}</span>
                <span>{challenge.ownerDepartment}</span>
                <span>{challenge.ideaCount} {text.challenges.ideaCount}</span>
              </button>
            ))}
          </div>
        </div>
        {challengeDetails ? (
          <>
            <div className="section-break" />
            <div className="panel-card review-workspace-panel">
              <div className="challenge-top">
                <div>
                  <div className="eyebrow">{isArabic ? "تفاصيل التحدي" : "Challenge Workspace"}</div>
                  <h3>{challengeDetails.title}</h3>
                  <p>{challengeDetails.summary}</p>
                </div>
                <StatusPill label={statusLabels[challengeDetails.status] || challengeDetails.status} status={challengeDetails.status} />
              </div>
              <dl className="challenge-meta">
                <ChallengeMetaItem label={text.challenges.owner} value={challengeDetails.ownerDepartment} />
                <ChallengeMetaItem label={text.challenges.createdBy} value={`${challengeDetails.createdBy} · ${challengeDetails.creatorEmail}`} />
              </dl>
              <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{challengeDetails.scope}</p></div>
              <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{challengeDetails.objectives}</p></div>
              {challengeDetails.selectedIdeaTitle ? (
                <div className="detail-block compact-block selected-idea-banner">
                  <h3>{isArabic ? "الفكرة المعتمدة" : "Selected Idea"}</h3>
                  <p>{challengeDetails.selectedIdeaTitle}</p>
                </div>
              ) : null}
              <div className="selection-divider" />
              <h3>{isArabic ? "الأفكار المرتبطة بالتحدي" : "Ideas For This Challenge"}</h3>
              {challengeDetails.ideas?.length ? (
                <div className="stack-list">
                  {challengeDetails.ideas.map((idea) => (
                    <ChallengeIdeaCard key={idea.id} idea={idea} statusLabels={statusLabels} roleLabels={roleLabels} isArabic={isArabic} />
                  ))}
                </div>
              ) : (
                <p>{text.myIdeas.empty}</p>
              )}
            </div>
            {canManageChallenges ? (
              <div className="panel-card">
                <h3>{isArabic ? "إدارة التحدي" : "Manage Challenge"}</h3>
                <form className="form-card" onSubmit={onChallengeUpdate}>
                  <div className="hero-actions">
                    <button type="button" className="secondary-button" disabled={busy === "translate-manage-challenge"} onClick={onTranslateChallengeManager}>
                      <Globe2 size={18} />
                      {text.actions.translateEntries}
                    </button>
                  </div>
                  <Field label={text.createChallenge.challengeTitle} value={challengeManagerForm.title} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, title: value }))} />
                  <TextAreaField label={text.createChallenge.summary} value={challengeManagerForm.summary} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, summary: value }))} />
                  <TextAreaField label={text.createChallenge.scope} value={challengeManagerForm.scope} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, scope: value }))} />
                  <TextAreaField label={text.createChallenge.objectives} value={challengeManagerForm.objectives} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, objectives: value }))} />
                  <Field label={text.createChallenge.ownerDepartment} value={challengeManagerForm.ownerDepartment} onChange={(value) => setChallengeManagerForm((current) => ({ ...current, ownerDepartment: value }))} />
                  <div className="hero-actions">
                    <button type="submit" className="primary-button" disabled={busy === "updateChallenge"}>
                      <RefreshCw size={18} />
                      {isArabic ? "حفظ التعديلات" : "Save Changes"}
                    </button>
                    <button type="button" className="secondary-button danger-button" disabled={busy === "deleteChallenge"} onClick={onChallengeDelete}>
                      {isArabic ? "حذف التحدي" : "Delete Challenge"}
                    </button>
                  </div>
                </form>
                <div className="detail-block compact-block challenge-close-block">
                  <h3>{isArabic ? "إغلاق التحدي بفكرة معتمدة" : "Close Challenge With Selected Idea"}</h3>
                  <SelectField
                    label={isArabic ? "الفكرة المعتمدة" : "Selected Idea"}
                    value={selectedWinningIdeaId}
                    onChange={setSelectedWinningIdeaId}
                    options={[
                      { value: "", label: isArabic ? "اختر فكرة" : "Choose an idea" },
                      ...(challengeDetails.ideas || []).map((idea) => ({ value: String(idea.id), label: `${idea.title} · ${idea.submitterName}` })),
                    ]}
                  />
                  <button type="button" className="primary-button block-button" disabled={busy === "closeChallenge" || !challengeDetails.ideas?.length} onClick={onChallengeClose}>
                    <ShieldCheck size={18} />
                    {isArabic ? "اعتماد الفكرة وإغلاق التحدي" : "Select Idea And Close Challenge"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}

function LegacyReviewsPageStructured({
  text,
  challenges,
  selectedChallengeId,
  setSelectedChallengeId,
  challengeDetails,
  reviewQueue,
  reviewDrafts,
  setReviewDrafts,
  busy,
  onSubmit,
  roleLabels,
  statusLabels,
  isArabic,
}) {
  const reviewableChallengeIds = new Set(reviewQueue.map((idea) => String(idea.challengeId)));
  const reviewableChallenges = challenges.filter((challenge) => reviewableChallengeIds.has(String(challenge.id)));
  const challengeQueueCounts = reviewQueue.reduce((accumulator, idea) => {
    const key = String(idea.challengeId);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const challengeIdeas = challengeDetails?.ideas || [];

  return (
    <>
      <SectionHeader title={text.reviews.title} subtitle={text.reviews.subtitle} />
      <div className="workspace-stack">
        <div className="panel-card">
          <h3>{isArabic ? "التحديات التي تحتوي على أفكار للمراجعة" : "Challenges With Ideas To Review"}</h3>
          {reviewableChallenges.length === 0 ? (
            <div className="empty-panel"><p>{text.reviews.empty}</p></div>
          ) : (
            <div className="stack-list">
              {reviewableChallenges.map((challenge) => (
                <button key={challenge.id} type="button" className={`challenge-card challenge-select-card ${String(challenge.id) === String(selectedChallengeId) ? "selected-card" : ""}`} onClick={() => setSelectedChallengeId(String(challenge.id))}>
                  <div className="challenge-top">
                    <StatusPill label={statusLabels[challenge.status] || challenge.status} status={challenge.status} />
                    <span className="challenge-ideas">{challengeQueueCounts[String(challenge.id)] || 0} {isArabic ? "أفكار بانتظار المراجعة" : "ideas awaiting review"}</span>
                  </div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.summary}</p>
                  <dl className="challenge-meta">
                    <ChallengeMetaItem label={text.challenges.owner} value={challenge.ownerDepartment} />
                    <ChallengeMetaItem label={text.challenges.ideaCount} value={challenge.ideaCount} />
                  </dl>
                </button>
              ))}
            </div>
          )}
        </div>
        {challengeDetails ? (
          <>
            <div className="panel-card">
              <div className="challenge-top">
                <div><h3>{challengeDetails.title}</h3><p>{challengeDetails.summary}</p></div>
                <StatusPill label={statusLabels[challengeDetails.status] || challengeDetails.status} status={challengeDetails.status} />
              </div>
              <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{challengeDetails.scope}</p></div>
              <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{challengeDetails.objectives}</p></div>
            </div>
            <div className="panel-card">
              <h3>{isArabic ? "الأفكار تحت هذا التحدي" : "Ideas Under This Challenge"}</h3>
              {challengeIdeas.length ? (
                <div className="stack-list">
                  {challengeIdeas.map((idea) => {
                    const canReviewThisIdea = ["submitted", "under_review", "revision_requested"].includes(idea.status);
                    return (
                      <div key={idea.id} className="review-row-card">
                        <div className="review-row-header">
                          <div>
                            <h3>{idea.title}</h3>
                            <p>{idea.summary}</p>
                          </div>
                          <StatusPill label={statusLabels[idea.status] || idea.status} status={idea.status} />
                        </div>
                        <div className="review-row-grid">
                          <div className="detail-block compact-block">
                            <h3>{isArabic ? "بيانات مقدم الفكرة" : "Submitter Details"}</h3>
                            <div className="bullet-list">
                              <div className="list-row"><UserRound size={18} /><span>{idea.submitterName} · {idea.submitterEmail}</span></div>
                              <div className="list-row"><ShieldCheck size={18} /><span>{idea.submitterOrganization || "-"}</span></div>
                              <div className="list-row"><Workflow size={18} /><span>{roleLabels[idea.submitterRole] || idea.submitterRole}</span></div>
                            </div>
                          </div>
                          <div className="detail-block compact-block">
                            <h3>{isArabic ? "تفاصيل الفكرة" : "Idea Details"}</h3>
                            <div className="bullet-list">
                              <div className="list-row"><Workflow size={18} /><span>{idea.valueProposition}</span></div>
                              <div className="list-row"><ShieldCheck size={18} /><span>{idea.implementationPlan}</span></div>
                            </div>
                          </div>
                        </div>
                        {idea.reviews?.length ? (
                          <div className="detail-block compact-block">
                            <h3>{isArabic ? "سجل المراجعات" : "Review History"}</h3>
                            <div className="activity-list">
                              {idea.reviews.map((review) => (
                                <div key={review.id} className="activity-row compact-activity">
                                  <strong>{statusLabels[review.decision === "pilot" ? "pilot_ready" : review.decision === "approve" ? "approved" : review.decision === "reject" ? "rejected" : "revision_requested"] || review.decision}</strong>
                                  <span>{review.reviewerName} · {roleLabels[review.reviewerRole] || review.reviewerRole}</span>
                                  <span>{review.notes}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {canReviewThisIdea ? (
                          <>
                            <div className="form-grid review-form-grid">
                              <SelectField
                                label={text.reviews.decision}
                                value={reviewDrafts[idea.id]?.decision || ""}
                                onChange={(value) => setReviewDrafts((current) => ({ ...current, [idea.id]: { decision: value, notes: current[idea.id]?.notes || "" } }))}
                                options={[
                                  { value: "", label: text.reviews.decision },
                                  { value: "approve", label: text.reviews.approve },
                                  { value: "pilot", label: text.reviews.pilot },
                                  { value: "revise", label: text.reviews.revise },
                                  { value: "reject", label: text.reviews.reject },
                                ]}
                              />
                              <TextAreaField
                                label={text.reviews.notes}
                                value={reviewDrafts[idea.id]?.notes || ""}
                                onChange={(value) => setReviewDrafts((current) => ({ ...current, [idea.id]: { decision: current[idea.id]?.decision || "", notes: value } }))}
                              />
                            </div>
                            <button type="button" className="primary-button" disabled={busy === `review-${idea.id}`} onClick={() => onSubmit(idea.id)}>
                              <ClipboardCheck size={18} />
                              {text.reviews.submit}
                            </button>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>{text.reviews.empty}</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function ReviewsPage({
  text,
  challenges,
  selectedChallengeId,
  setSelectedChallengeId,
  challengeDetails,
  reviewQueue,
  reviewDrafts,
  setReviewDrafts,
  busy,
  onSubmit,
  roleLabels,
  statusLabels,
  isArabic,
}) {
  const reviewableChallengeIds = new Set(reviewQueue.map((idea) => String(idea.challengeId)));
  const reviewableChallenges = challenges.filter((challenge) => reviewableChallengeIds.has(String(challenge.id)));
  const challengeQueueCounts = reviewQueue.reduce((accumulator, idea) => {
    const key = String(idea.challengeId);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const selectedReviewChallenge = challengeDetails && reviewableChallengeIds.has(String(challengeDetails.id)) ? challengeDetails : null;
  const challengeIdeas = selectedReviewChallenge?.ideas || [];
  const reviewableIdeas = challengeIdeas.filter((idea) => ["submitted", "under_review", "revision_requested"].includes(idea.status));
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [selectedReviewIdeaId, setSelectedReviewIdeaId] = useState("");
  const selectedReviewIdea =
    challengeIdeas.find((idea) => String(idea.id) === String(selectedReviewIdeaId)) ||
    reviewableIdeas[0] ||
    challengeIdeas[0] ||
    null;

  useEffect(() => {
    setShowChallengePicker(false);
  }, [selectedReviewChallenge?.id]);

  useEffect(() => {
    if (!selectedReviewIdea) {
      setSelectedReviewIdeaId("");
      return;
    }
    setSelectedReviewIdeaId((current) => (String(current) === String(selectedReviewIdea.id) ? current : String(selectedReviewIdea.id)));
  }, [selectedReviewIdea?.id]);

  return (
    <>
      <SectionHeader title={text.reviews.title} subtitle={text.reviews.subtitle} />
      <div className="workspace-stack">
        <div className="panel-card selection-panel">
          <h3>{isArabic ? "اختيار التحدي والفكرة" : "Select Challenge And Idea"}</h3>
          {reviewableChallenges.length === 0 ? (
            <div className="empty-panel"><p>{text.reviews.empty}</p></div>
          ) : selectedReviewChallenge && !showChallengePicker ? (
            <div className="stack-list">
              <div className="selection-summary-card">
                <div className="challenge-top">
                  <StatusPill label={statusLabels[selectedReviewChallenge.status] || selectedReviewChallenge.status} status={selectedReviewChallenge.status} />
                  <span className="challenge-ideas">{challengeQueueCounts[String(selectedReviewChallenge.id)] || 0} {isArabic ? "أفكار بانتظار المراجعة" : "ideas awaiting review"}</span>
                </div>
                <h3>{selectedReviewChallenge.title}</h3>
                <p>{selectedReviewChallenge.summary}</p>
              </div>
              <div className="hero-actions">
                <button type="button" className="secondary-button" onClick={() => setShowChallengePicker(true)}>
                  {isArabic ? "تغيير التحدي" : "Change Challenge"}
                </button>
              </div>
            </div>
          ) : (
            <div className="stack-list">
              {reviewableChallenges.map((challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  className={`challenge-card challenge-select-card ${String(challenge.id) === String(selectedChallengeId) ? "selected-card" : ""}`}
                  onClick={() => {
                    setSelectedChallengeId(String(challenge.id));
                    setShowChallengePicker(false);
                  }}
                >
                  <div className="challenge-top">
                    <StatusPill label={statusLabels[challenge.status] || challenge.status} status={challenge.status} />
                    <span className="challenge-ideas">{challengeQueueCounts[String(challenge.id)] || 0} {isArabic ? "أفكار بانتظار المراجعة" : "ideas awaiting review"}</span>
                  </div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.summary}</p>
                  <dl className="challenge-meta">
                    <ChallengeMetaItem label={text.challenges.owner} value={challenge.ownerDepartment} />
                    <ChallengeMetaItem label={text.challenges.ideaCount} value={challenge.ideaCount} />
                  </dl>
                </button>
              ))}
            </div>
          )}
          {selectedReviewChallenge ? (
            <>
              <div className="selection-divider" />
              <div className="selection-subsection">
                <h3>{isArabic ? "الأفكار تحت التحدي المختار" : "Ideas Under The Selected Challenge"}</h3>
                <div className="stack-list review-idea-picker">
                  {challengeIdeas.map((idea) => (
                    <button key={idea.id} type="button" className={`activity-row selection-summary-card review-idea-button ${String(idea.id) === String(selectedReviewIdea?.id) ? "selected-card" : ""}`} onClick={() => setSelectedReviewIdeaId(String(idea.id))}>
                      <div className="challenge-top">
                        <strong>{idea.title}</strong>
                        <StatusPill label={statusLabels[idea.status] || idea.status} status={idea.status} />
                      </div>
                      <span>{idea.submitterName} · {idea.submitterEmail}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
        {selectedReviewIdea ? (
          <>
            <div className="section-break" />
            <div className="panel-card review-workspace-panel">
              <div className="challenge-top">
                <div>
                  <div className="eyebrow">{isArabic ? "مساحة المراجعة" : "Review Workspace"}</div>
                  <h3>{selectedReviewChallenge.title}</h3>
                  <p>{selectedReviewChallenge.summary}</p>
                </div>
                <StatusPill label={statusLabels[selectedReviewChallenge.status] || selectedReviewChallenge.status} status={selectedReviewChallenge.status} />
              </div>
              <div className="detail-block compact-block"><h3>{text.challenges.scope}</h3><p>{selectedReviewChallenge.scope}</p></div>
              <div className="detail-block compact-block"><h3>{text.challenges.objectives}</h3><p>{selectedReviewChallenge.objectives}</p></div>
              <div className="selection-divider" />
              <div className="review-row-card">
                <div className="review-row-header">
                  <div>
                    <h3>{selectedReviewIdea.title}</h3>
                    <p>{selectedReviewIdea.summary}</p>
                  </div>
                  <StatusPill label={statusLabels[selectedReviewIdea.status] || selectedReviewIdea.status} status={selectedReviewIdea.status} />
                </div>
                <div className="review-row-grid">
                  <div className="detail-block compact-block">
                    <h3>{isArabic ? "بيانات مقدم الفكرة" : "Submitter Details"}</h3>
                    <div className="bullet-list">
                      <div className="list-row"><UserRound size={18} /><span>{selectedReviewIdea.submitterName} · {selectedReviewIdea.submitterEmail}</span></div>
                      <div className="list-row"><ShieldCheck size={18} /><span>{selectedReviewIdea.submitterOrganization || "-"}</span></div>
                      <div className="list-row"><Workflow size={18} /><span>{roleLabels[selectedReviewIdea.submitterRole] || selectedReviewIdea.submitterRole}</span></div>
                    </div>
                  </div>
                  <div className="detail-block compact-block">
                    <h3>{isArabic ? "تفاصيل الفكرة" : "Idea Details"}</h3>
                    <div className="bullet-list">
                      <div className="list-row"><Workflow size={18} /><span>{selectedReviewIdea.valueProposition}</span></div>
                      <div className="list-row"><ShieldCheck size={18} /><span>{selectedReviewIdea.implementationPlan}</span></div>
                    </div>
                  </div>
                </div>
                {selectedReviewIdea.reviews?.length ? (
                  <div className="detail-block compact-block">
                    <h3>{isArabic ? "سجل المراجعات" : "Review History"}</h3>
                    <div className="activity-list">
                      {selectedReviewIdea.reviews.map((review) => (
                        <div key={review.id} className="activity-row compact-activity">
                          <strong>{statusLabels[review.decision === "pilot" ? "pilot_ready" : review.decision === "approve" ? "approved" : review.decision === "reject" ? "rejected" : "revision_requested"] || review.decision}</strong>
                          <span>{review.reviewerName} · {roleLabels[review.reviewerRole] || review.reviewerRole}</span>
                          <span>{review.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {["submitted", "under_review", "revision_requested"].includes(selectedReviewIdea.status) ? (
                  <>
                    <div className="form-grid review-form-grid">
                      <SelectField
                        label={text.reviews.decision}
                        value={reviewDrafts[selectedReviewIdea.id]?.decision || ""}
                        onChange={(value) => setReviewDrafts((current) => ({ ...current, [selectedReviewIdea.id]: { decision: value, notes: current[selectedReviewIdea.id]?.notes || "" } }))}
                        options={[
                          { value: "", label: text.reviews.decision },
                          { value: "approve", label: text.reviews.approve },
                          { value: "pilot", label: text.reviews.pilot },
                          { value: "revise", label: text.reviews.revise },
                          { value: "reject", label: text.reviews.reject },
                        ]}
                      />
                      <TextAreaField
                        label={text.reviews.notes}
                        value={reviewDrafts[selectedReviewIdea.id]?.notes || ""}
                        onChange={(value) => setReviewDrafts((current) => ({ ...current, [selectedReviewIdea.id]: { decision: current[selectedReviewIdea.id]?.decision || "", notes: value } }))}
                      />
                    </div>
                    <button type="button" className="primary-button" disabled={busy === `review-${selectedReviewIdea.id}`} onClick={() => onSubmit(selectedReviewIdea.id)}>
                      <ClipboardCheck size={18} />
                      {text.reviews.submit}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function AdminPage({ text, adminData, managedUsers, userActions, setUserActions, busy, onUserAction }) {
  if (!adminData) return null;

  return (
    <>
      <SectionHeader title={text.admin.title} subtitle={text.admin.subtitle} />
      <div className="stats-grid">
        <InfoCard value={adminData.metrics.users} label={text.admin.users} />
        <InfoCard value={adminData.metrics.challenges} label={text.home.cards.challenges} />
        <InfoCard value={adminData.metrics.ideas} label={text.home.cards.ideas} />
        <InfoCard value={adminData.metrics.reviews} label={text.home.cards.reviews} />
      </div>
      <div className="admin-layout">
        <article className="panel-card">
          <h3>{text.admin.users}</h3>
          <div className="activity-list">
            {managedUsers.map((entry) => (
              <div key={entry.id} className="activity-row">
                <strong>{entry.name}</strong>
                <span>{entry.email}</span>
                <span>{text.roles[entry.role]}</span>
                <span>{entry.organization || "-"}</span>
                <div className="form-grid user-action-grid">
                  <Field label="Reason" value={userActions[entry.id]?.reason || ""} onChange={(value) => setUserActions((current) => ({ ...current, [entry.id]: { ...current[entry.id], reason: value } }))} />
                  <Field label="New Password" value={userActions[entry.id]?.newPassword || ""} onChange={(value) => setUserActions((current) => ({ ...current, [entry.id]: { ...current[entry.id], newPassword: value } }))} />
                </div>
                <div className="hero-actions">
                  {entry.isBlocked ? (
                    <button type="button" className="secondary-button" disabled={busy === `unblock-${entry.id}`} onClick={() => onUserAction("unblock", entry.id)}>Unblock</button>
                  ) : (
                    <button type="button" className="secondary-button" disabled={busy === `block-${entry.id}`} onClick={() => onUserAction("block", entry.id)}>Block</button>
                  )}
                  <button type="button" className="secondary-button" disabled={busy === `reset-${entry.id}`} onClick={() => onUserAction("reset", entry.id)}>Reset Password</button>
                  <button type="button" className="secondary-button danger-button" disabled={busy === `delete-${entry.id}`} onClick={() => onUserAction("delete", entry.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </article>
        <aside className="side-column">
          <div className="panel-card">
            <h3>{text.admin.recentChallenges}</h3>
            <div className="activity-list">
              {adminData.challenges.map((challenge) => (
                <div key={challenge.id} className="activity-row compact-activity">
                  <strong>{challenge.title}</strong>
                  <span>{challenge.ownerDepartment}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-card">
            <h3>{text.admin.recentIdeas}</h3>
            <div className="activity-list">
              {adminData.ideas.map((idea) => (
                <div key={idea.id} className="activity-row compact-activity">
                  <strong>{idea.title}</strong>
                  <span>{idea.challengeTitle}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ChatbotPage({ text, user, chatMessages, chatInput, setChatInput, chatStatus, onSubmit, challenges, onChatSubmission }) {
  return (
    <>
      <SectionHeader title={text.chatbot.title} subtitle={text.chatbot.subtitle} />
      <div className="chatbot-layout">
        <article className="panel-card chatbot-shell">
          <div className="chatbot-thread">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}>
                <div className="chat-avatar">{message.role === "user" ? <UserRound size={18} /> : <Bot size={18} />}</div>
                <div className="chat-bubble">
                  <div className="chat-label">{message.role === "user" ? user.name : text.nav.chatbot}</div>
                  <p>{message.content}</p>
                  {message.submission && (
                    <div className="chat-submission-card">
                      <div className="chat-submission-top"><Bot size={18} /><span>{message.submission.kind}</span></div>
                      <strong>{message.submission.title}</strong>
                      <p>{message.submission.detail}</p>
                      {message.submission.kind === "idea" && (
                        <button type="button" className="secondary-button block-button" onClick={() => onChatSubmission(message.submission)}>
                          Submit This Idea
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatStatus === "loading" && (
              <div className="chat-message assistant">
                <div className="chat-avatar"><Bot size={18} /></div>
                <div className="chat-bubble thinking-bubble"><div className="chat-label">{text.nav.chatbot}</div><p>{text.chatbot.loading}</p></div>
              </div>
            )}
          </div>
          <form className="chatbot-composer" onSubmit={onSubmit}>
            <textarea rows="3" value={chatInput} placeholder={text.chatbot.placeholder} onChange={(event) => setChatInput(event.target.value)} />
            <button type="submit" className="primary-button chatbot-send" disabled={chatStatus === "loading"}>
              {text.chatbot.send}
              <Send size={16} />
            </button>
          </form>
        </article>
        <aside className="side-column">
          <div className="panel-card">
            <h3>{text.challenges.title}</h3>
            <div className="activity-list">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="activity-row compact-activity">
                  <strong>{challenge.title}</strong>
                  <span>{challenge.ownerDepartment}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function demoAccounts(text) {
  return [
    { role: text.roles.admin, email: "admin@momah.sa", password: "Admin123!" },
    { role: text.roles.innovation_director, email: "director@momah.sa", password: "Director123!" },
    { role: text.roles.innovation_staff, email: "staff@momah.sa", password: "Staff123!" },
    { role: text.roles.innovation_expert, email: "expert@momah.sa", password: "Expert123!" },
    { role: text.roles.sector_owner, email: "sector@momah.sa", password: "Sector123!" },
  ];
}
