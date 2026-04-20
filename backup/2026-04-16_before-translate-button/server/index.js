import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import { db, MINISTRY_CHALLENGE_ROLES, REVIEWER_ROLES, ROLES, serializeUser } from "./db.js";

dotenv.config({ path: ".env.local", override: false });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "momah-local-development-secret";
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "innovation-platform@momah.local";
const privilegedUserAdminRoles = [ROLES.admin, ROLES.innovationDirector];
const privilegedChallengeRoles = [ROLES.admin, ROLES.innovationDirector];

const app = express();

app.use(express.json());

const mailer =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

function createNotification(userId, type, title, body, relatedType = null, relatedId = null) {
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, type, title, body, relatedType, relatedId);
}

async function sendEmailNotification(to, subject, text) {
  if (!mailer || !to) return;

  await mailer.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
  });
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, jwtSecret, {
    expiresIn: "7d",
  });
}

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireAuth(req, res, next) {
  const token = getAuthToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = db
      .prepare("SELECT id, name, email, role, organization, is_blocked, blocked_reason FROM users WHERE id = ?")
      .get(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Session is no longer valid." });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        error: user.blocked_reason || "Your account has been blocked. Please contact the platform administrator.",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session token." });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have access to this action." });
    }

    return next();
  };
}

function listChallenges() {
  return db
    .prepare(`
      SELECT
        c.id,
        c.title,
        c.summary,
        c.scope,
        c.objectives,
        c.owner_department AS ownerDepartment,
        c.status,
        c.created_at AS createdAt,
        COALESCE(c.updated_at, c.created_at) AS updatedAt,
        c.closed_at AS closedAt,
        c.selected_idea_id AS selectedIdeaId,
        u.name AS createdBy,
        selected_idea.title AS selectedIdeaTitle,
        COUNT(i.id) AS ideaCount
      FROM challenges c
      JOIN users u ON u.id = c.created_by
      LEFT JOIN ideas selected_idea ON selected_idea.id = c.selected_idea_id
      LEFT JOIN ideas i ON i.challenge_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
    `)
    .all();
}

function getChallengeDetails(challengeId) {
  const challenge = db
    .prepare(`
      SELECT
        c.id,
        c.title,
        c.summary,
        c.scope,
        c.objectives,
        c.owner_department AS ownerDepartment,
        c.status,
        c.created_at AS createdAt,
        COALESCE(c.updated_at, c.created_at) AS updatedAt,
        c.closed_at AS closedAt,
        c.selected_idea_id AS selectedIdeaId,
        u.name AS createdBy,
        u.email AS creatorEmail,
        selected_idea.title AS selectedIdeaTitle
      FROM challenges c
      JOIN users u ON u.id = c.created_by
      LEFT JOIN ideas selected_idea ON selected_idea.id = c.selected_idea_id
      WHERE c.id = ?
    `)
    .get(challengeId);

  if (!challenge) return null;

  const ideas = db
    .prepare(`
      SELECT
        i.id,
        i.title,
        i.summary,
        i.value_proposition AS valueProposition,
        i.implementation_plan AS implementationPlan,
        i.status,
        i.created_at AS createdAt,
        COALESCE(i.updated_at, i.created_at) AS updatedAt,
        u.id AS submitterId,
        u.name AS submitterName,
        u.email AS submitterEmail,
        u.organization AS submitterOrganization,
        u.role AS submitterRole
      FROM ideas i
      JOIN users u ON u.id = i.submitter_id
      WHERE i.challenge_id = ?
      ORDER BY COALESCE(i.updated_at, i.created_at) DESC
    `)
    .all(challengeId);

  const reviews = db
    .prepare(`
      SELECT
        r.id,
        r.idea_id AS ideaId,
        r.decision,
        r.notes,
        r.created_at AS createdAt,
        reviewer.name AS reviewerName,
        reviewer.role AS reviewerRole
      FROM reviews r
      JOIN ideas i ON i.id = r.idea_id
      JOIN users reviewer ON reviewer.id = r.reviewer_id
      WHERE i.challenge_id = ?
      ORDER BY r.created_at DESC
    `)
    .all(challengeId);

  const reviewsByIdeaId = reviews.reduce((accumulator, review) => {
    const key = String(review.ideaId);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(review);
    return accumulator;
  }, {});

  return {
    ...challenge,
    ideas: ideas.map((idea) => ({
      ...idea,
      reviews: reviewsByIdeaId[String(idea.id)] || [],
    })),
  };
}

function listNotifications(userId) {
  return db
    .prepare(`
      SELECT
        id,
        type,
        title,
        body,
        related_type AS relatedType,
        related_id AS relatedId,
        is_read AS isRead,
        created_at AS createdAt
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `)
    .all(userId)
    .map((item) => ({ ...item, isRead: Boolean(item.isRead) }));
}

function listIdeasForReview() {
  return db
    .prepare(`
      SELECT
        i.id,
        i.title,
        i.summary,
        i.value_proposition AS valueProposition,
        i.implementation_plan AS implementationPlan,
        i.status,
        i.created_at AS createdAt,
        c.id AS challengeId,
        c.title AS challengeTitle,
        u.name AS submitterName,
        u.organization AS submitterOrganization,
        (
          SELECT COUNT(*) FROM reviews r WHERE r.idea_id = i.id
        ) AS reviewCount
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      JOIN users u ON u.id = i.submitter_id
      WHERE i.status IN ('submitted', 'under_review', 'revision_requested')
      ORDER BY
        CASE i.status
          WHEN 'submitted' THEN 0
          WHEN 'under_review' THEN 1
          WHEN 'revision_requested' THEN 2
          ELSE 3
        END,
        i.created_at DESC
    `)
    .all();
}

function buildDashboard(user) {
  const counts = {
    challengeCount: db.prepare("SELECT COUNT(*) AS count FROM challenges").get().count,
    ideaCount: db.prepare("SELECT COUNT(*) AS count FROM ideas").get().count,
    reviewCount: db.prepare("SELECT COUNT(*) AS count FROM reviews").get().count,
    pendingIdeas: db
      .prepare("SELECT COUNT(*) AS count FROM ideas WHERE status IN ('submitted', 'under_review', 'revision_requested')")
      .get().count,
    unreadNotifications: db
      .prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0")
      .get(user.id).count,
  };

  const recentIdeas = db
    .prepare(`
      SELECT i.id, i.title, i.status, c.title AS challengeTitle
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      ORDER BY i.created_at DESC
      LIMIT 5
    `)
    .all();

  return {
    user: serializeUser(user),
    counts,
    recentIdeas,
    notifications: listNotifications(user.id),
  };
}

function createChatInstructions(user) {
  return `
You are the Innovation AI Assistant for a Ministry innovation platform.
Respond in the user's requested language only.
Write in a polished, professional format with short section headings and bullet points when useful.
When asked for a scope or plan, structure the response with:
- Overview
- Challenge Scope
- Objectives
- In Scope
- Out of Scope
- Suggested Work Plan
- Success Metrics
- Risks and Considerations
Keep the content specific, executive-ready, and practical.
Use only the challenge and platform context supplied to you.
If the user clearly asks to submit an idea or challenge, return a JSON response with a "submission" object. Otherwise set "submission" to null.
Return valid JSON with this shape:
{
  "reply": "formatted plain text response",
  "submission": null | {
    "kind": "idea" | "challenge",
    "challengeId": 1,
    "title": "submission title",
    "summary": "short summary",
    "valueProposition": "value proposition text",
    "implementationPlan": "implementation plan text",
    "detail": "short detail"
  }
}
Current user role: ${user.role}
`.trim();
}

async function getOpenAiChatResponse(user, language, message) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing from the server environment.");
  }

  const context = {
    user,
    language,
    message,
    challenges: listChallenges(),
    reviewQueueSummary: REVIEWER_ROLES.includes(user.role)
      ? listIdeasForReview().slice(0, 5)
      : [],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: createChatInstructions(user) }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(context, null, 2) }],
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  const text =
    payload.output_text ||
    payload.output
      ?.flatMap((item) => item.content || [])
      ?.map((item) => item.text || "")
      ?.join("\n")
      ?.trim();

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { reply: cleaned, submission: null };
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, organization, accountType } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const role =
    accountType === ROLES.partnerEntity ? ROLES.partnerEntity : ROLES.publicUser;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const result = db
    .prepare(`
      INSERT INTO users (name, email, password_hash, role, organization)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      String(name).trim(),
      normalizedEmail,
      bcrypt.hashSync(password, 10),
      role,
      organization ? String(organization).trim() : null,
    );

  const user = db
    .prepare("SELECT id, name, email, role, organization, is_blocked, blocked_reason FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  return res.status(201).json({
    token: createToken(user),
    user: serializeUser(user),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  if (user.is_blocked) {
    return res.status(403).json({
      error: user.blocked_reason || "This account has been blocked. Please contact the platform administrator.",
    });
  }

  return res.json({
    token: createToken(user),
    user: serializeUser(user),
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.get("/api/notifications", requireAuth, (req, res) => {
  res.json({ notifications: listNotifications(req.user.id) });
});

app.post("/api/notifications/:notificationId/read", requireAuth, (req, res) => {
  const { notificationId } = req.params;
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(notificationId, req.user.id);
  res.json({ ok: true });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  res.json(buildDashboard(req.user));
});

app.get("/api/challenges", requireAuth, (_req, res) => {
  res.json({ challenges: listChallenges() });
});

app.get("/api/challenges/:challengeId", requireAuth, (req, res) => {
  const { challengeId } = req.params;
  const challenge = getChallengeDetails(challengeId);

  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found." });
  }

  return res.json({ challenge });
});

app.post(
  "/api/challenges",
  requireAuth,
  requireRole(MINISTRY_CHALLENGE_ROLES),
  (req, res) => {
    const { title, summary, scope, objectives, ownerDepartment } = req.body ?? {};

    if (!title || !summary || !scope || !objectives || !ownerDepartment) {
      return res.status(400).json({ error: "All challenge fields are required." });
    }

    const result = db
      .prepare(`
        INSERT INTO challenges (title, summary, scope, objectives, owner_department, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        String(title).trim(),
        String(summary).trim(),
        String(scope).trim(),
        String(objectives).trim(),
        String(ownerDepartment).trim(),
        req.user.id,
      );

    const challenge = db
      .prepare(`
        SELECT
          c.id,
          c.title,
          c.summary,
          c.scope,
          c.objectives,
          c.owner_department AS ownerDepartment,
          c.status,
          c.created_at AS createdAt,
          COALESCE(c.updated_at, c.created_at) AS updatedAt,
          c.closed_at AS closedAt,
          c.selected_idea_id AS selectedIdeaId,
          u.name AS createdBy,
          NULL AS selectedIdeaTitle,
          0 AS ideaCount
        FROM challenges c
        JOIN users u ON u.id = c.created_by
        WHERE c.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({ challenge });
  },
);

app.put(
  "/api/challenges/:challengeId",
  requireAuth,
  requireRole(privilegedChallengeRoles),
  (req, res) => {
    const { challengeId } = req.params;
    const { title, summary, scope, objectives, ownerDepartment } = req.body ?? {};

    if (!title || !summary || !scope || !objectives || !ownerDepartment) {
      return res.status(400).json({ error: "All challenge fields are required." });
    }

    const challenge = db.prepare("SELECT id FROM challenges WHERE id = ?").get(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    db.prepare(`
      UPDATE challenges
      SET title = ?, summary = ?, scope = ?, objectives = ?, owner_department = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      String(title).trim(),
      String(summary).trim(),
      String(scope).trim(),
      String(objectives).trim(),
      String(ownerDepartment).trim(),
      challengeId,
    );

    return res.json({ challenge: getChallengeDetails(challengeId) });
  },
);

app.delete(
  "/api/challenges/:challengeId",
  requireAuth,
  requireRole(privilegedChallengeRoles),
  (req, res) => {
    const { challengeId } = req.params;
    const challenge = db.prepare("SELECT id, title FROM challenges WHERE id = ?").get(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    db.prepare("DELETE FROM challenges WHERE id = ?").run(challengeId);
    return res.json({ ok: true, deletedChallengeId: Number(challengeId), title: challenge.title });
  },
);

app.post(
  "/api/challenges/:challengeId/close",
  requireAuth,
  requireRole(privilegedChallengeRoles),
  (req, res) => {
    const { challengeId } = req.params;
    const { selectedIdeaId } = req.body ?? {};

    if (!selectedIdeaId) {
      return res.status(400).json({ error: "A selected idea is required to close the challenge." });
    }

    const challenge = db
      .prepare("SELECT id, title, status FROM challenges WHERE id = ?")
      .get(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const idea = db
      .prepare(`
        SELECT i.id, i.title, i.submitter_id AS submitterId, u.email AS submitterEmail, u.name AS submitterName
        FROM ideas i
        JOIN users u ON u.id = i.submitter_id
        WHERE i.id = ? AND i.challenge_id = ?
      `)
      .get(selectedIdeaId, challengeId);

    if (!idea) {
      return res.status(400).json({ error: "The selected idea does not belong to this challenge." });
    }

    db.prepare("UPDATE ideas SET status = 'rejected' WHERE challenge_id = ? AND id <> ?").run(challengeId, selectedIdeaId);
    db.prepare(`
      UPDATE challenges
      SET status = 'closed', selected_idea_id = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(selectedIdeaId, challengeId);

    db.prepare("UPDATE ideas SET status = 'approved' WHERE id = ?").run(selectedIdeaId);

    createNotification(
      idea.submitterId,
      "challenge_closed",
      "Your idea was selected",
      `Your idea "${idea.title}" was selected to close challenge "${challenge.title}".`,
      "challenge",
      Number(challengeId),
    );
    void sendEmailNotification(
      idea.submitterEmail,
      "Your idea was selected",
      `Your idea "${idea.title}" was selected to close challenge "${challenge.title}".`,
    );

    return res.json({ challenge: getChallengeDetails(challengeId) });
  },
);

app.post("/api/ideas", requireAuth, (req, res) => {
  const { challengeId, title, summary, valueProposition, implementationPlan } = req.body ?? {};

  if (!challengeId || !title || !summary || !valueProposition || !implementationPlan) {
    return res.status(400).json({ error: "All idea fields are required." });
  }

  const challenge = db.prepare("SELECT id, status FROM challenges WHERE id = ?").get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found." });
  }
  if (challenge.status !== "open") {
    return res.status(400).json({ error: "Ideas can be submitted only to open challenges." });
  }

  const result = db
    .prepare(`
      INSERT INTO ideas (challenge_id, title, summary, value_proposition, implementation_plan, submitter_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      challengeId,
      String(title).trim(),
      String(summary).trim(),
      String(valueProposition).trim(),
      String(implementationPlan).trim(),
      req.user.id,
    );

  const idea = db
    .prepare(`
      SELECT
        i.id,
        i.title,
        i.summary,
        i.value_proposition AS valueProposition,
        i.implementation_plan AS implementationPlan,
        i.status,
        i.created_at AS createdAt,
        COALESCE(i.updated_at, i.created_at) AS updatedAt,
        c.title AS challengeTitle
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      WHERE i.id = ?
    `)
    .get(result.lastInsertRowid);

  return res.status(201).json({ idea });
});

app.put("/api/ideas/:ideaId", requireAuth, (req, res) => {
  const { ideaId } = req.params;
  const { title, summary, valueProposition, implementationPlan } = req.body ?? {};

  if (!title || !summary || !valueProposition || !implementationPlan) {
    return res.status(400).json({ error: "All idea fields are required." });
  }

  const idea = db
    .prepare(`
      SELECT i.id, i.submitter_id AS submitterId, i.challenge_id AS challengeId, c.title AS challengeTitle, c.status AS challengeStatus
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      WHERE i.id = ?
    `)
    .get(ideaId);

  if (!idea) {
    return res.status(404).json({ error: "Idea not found." });
  }

  if (idea.submitterId !== req.user.id) {
    return res.status(403).json({ error: "You can edit only your own ideas." });
  }
  if (idea.challengeStatus !== "open") {
    return res.status(400).json({ error: "Ideas under a closed challenge cannot be edited." });
  }

  db.prepare(`
    UPDATE ideas
    SET title = ?, summary = ?, value_proposition = ?, implementation_plan = ?, status = 'submitted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    String(title).trim(),
    String(summary).trim(),
    String(valueProposition).trim(),
    String(implementationPlan).trim(),
    ideaId,
  );

  const ministryUsers = db
    .prepare(`
      SELECT id, email
      FROM users
      WHERE role IN (?, ?, ?, ?, ?)
    `)
    .all(ROLES.admin, ROLES.innovationDirector, ROLES.innovationStaff, ROLES.innovationExpert, ROLES.sectorOwner);

  for (const ministryUser of ministryUsers) {
    createNotification(
      ministryUser.id,
      "idea_updated",
      "Idea updated by submitter",
      `${req.user.name} updated the idea "${title}" for challenge "${idea.challengeTitle}".`,
      "idea",
      Number(ideaId),
    );
    void sendEmailNotification(
      ministryUser.email,
      "Idea updated on Innovation Platform",
      `${req.user.name} updated the idea "${title}" for challenge "${idea.challengeTitle}".`,
    );
  }

  return res.json({ ok: true });
});

app.get("/api/ideas/mine", requireAuth, (req, res) => {
  const ideas = db
    .prepare(`
      SELECT
        i.id,
        i.challenge_id AS challengeId,
        i.title,
        i.summary,
        i.value_proposition AS valueProposition,
        i.implementation_plan AS implementationPlan,
        i.status,
        i.created_at AS createdAt,
        COALESCE(i.updated_at, i.created_at) AS updatedAt,
        c.title AS challengeTitle,
        c.summary AS challengeSummary,
        c.scope AS challengeScope,
        c.objectives AS challengeObjectives,
        c.status AS challengeStatus
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      WHERE i.submitter_id = ?
      ORDER BY i.created_at DESC
    `)
    .all(req.user.id);

  const reviews = db
    .prepare(`
      SELECT
        r.id,
        r.idea_id AS ideaId,
        r.decision,
        r.notes,
        r.created_at AS createdAt,
        reviewer.name AS reviewerName,
        reviewer.role AS reviewerRole
      FROM reviews r
      JOIN ideas i ON i.id = r.idea_id
      JOIN users reviewer ON reviewer.id = r.reviewer_id
      WHERE i.submitter_id = ?
      ORDER BY r.created_at DESC
    `)
    .all(req.user.id);

  const reviewsByIdeaId = reviews.reduce((accumulator, review) => {
    const key = String(review.ideaId);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(review);
    return accumulator;
  }, {});

  res.json({
    ideas: ideas.map((idea) => ({
      ...idea,
      reviews: reviewsByIdeaId[String(idea.id)] || [],
    })),
  });
});

app.delete("/api/ideas/:ideaId", requireAuth, (req, res) => {
  const { ideaId } = req.params;
  const idea = db
    .prepare(`
      SELECT i.id, i.submitter_id AS submitterId, i.status, c.status AS challengeStatus
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      WHERE i.id = ?
    `)
    .get(ideaId);

  if (!idea) {
    return res.status(404).json({ error: "Idea not found." });
  }

  if (idea.submitterId !== req.user.id) {
    return res.status(403).json({ error: "You can delete only your own ideas." });
  }

  if (idea.challengeStatus !== "open") {
    return res.status(400).json({ error: "Ideas under a closed challenge cannot be deleted." });
  }

  db.prepare("DELETE FROM ideas WHERE id = ?").run(ideaId);
  return res.json({ ok: true });
});

app.get("/api/reviews/pending", requireAuth, requireRole(REVIEWER_ROLES), (_req, res) => {
  res.json({ ideas: listIdeasForReview() });
});

app.post("/api/ideas/:ideaId/reviews", requireAuth, requireRole(REVIEWER_ROLES), (req, res) => {
  const { ideaId } = req.params;
  const { decision, notes } = req.body ?? {};

  if (!decision || !notes) {
    return res.status(400).json({ error: "Decision and review notes are required." });
  }

  const idea = db
    .prepare(`
      SELECT i.id, i.submitter_id AS submitterId, i.title, c.title AS challengeTitle, u.email AS submitterEmail
      FROM ideas i
      JOIN challenges c ON c.id = i.challenge_id
      JOIN users u ON u.id = i.submitter_id
      WHERE i.id = ?
    `)
    .get(ideaId);
  if (!idea) {
    return res.status(404).json({ error: "Idea not found." });
  }

  db.prepare(`
    INSERT INTO reviews (idea_id, reviewer_id, decision, notes)
    VALUES (?, ?, ?, ?)
  `).run(ideaId, req.user.id, String(decision), String(notes).trim());

  const statusMap = {
    approve: "approved",
    reject: "rejected",
    revise: "revision_requested",
    pilot: "pilot_ready",
  };

  db.prepare("UPDATE ideas SET status = ? WHERE id = ?").run(statusMap[decision] || "under_review", ideaId);

  const finalStatus = statusMap[decision] || "under_review";
  createNotification(
    idea.submitterId,
    "idea_reviewed",
    "Your idea has been reviewed",
    `Your idea "${idea.title}" for challenge "${idea.challengeTitle}" was reviewed with status "${finalStatus}".`,
    "idea",
    Number(ideaId),
  );
  void sendEmailNotification(
    idea.submitterEmail,
    "Your idea was reviewed",
    `Your idea "${idea.title}" for challenge "${idea.challengeTitle}" was reviewed with status "${finalStatus}". Notes: ${String(notes).trim()}`,
  );

  return res.json({ ok: true });
});

app.get("/api/admin/overview", requireAuth, requireRole([ROLES.admin]), (_req, res) => {
  const users = db
    .prepare(`
      SELECT id, name, email, role, organization, created_at AS createdAt
      FROM users
      ORDER BY created_at DESC
      LIMIT 12
    `)
    .all();

  const challenges = listChallenges();
  const ideas = listIdeasForReview().slice(0, 12);

  res.json({
    metrics: {
      users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
      ministryUsers: db
        .prepare(
          "SELECT COUNT(*) AS count FROM users WHERE role IN (?, ?, ?, ?, ?)",
        )
        .get(
          ROLES.admin,
          ROLES.innovationDirector,
          ROLES.innovationStaff,
          ROLES.innovationExpert,
          ROLES.sectorOwner,
        ).count,
      challenges: db.prepare("SELECT COUNT(*) AS count FROM challenges").get().count,
      ideas: db.prepare("SELECT COUNT(*) AS count FROM ideas").get().count,
      reviews: db.prepare("SELECT COUNT(*) AS count FROM reviews").get().count,
    },
    users,
    challenges,
    ideas,
  });
});

app.get("/api/users", requireAuth, requireRole(privilegedUserAdminRoles), (_req, res) => {
  const users = db
    .prepare(`
      SELECT id, name, email, role, organization, is_blocked AS isBlocked, blocked_reason AS blockedReason, created_at AS createdAt
      FROM users
      ORDER BY created_at DESC
    `)
    .all()
    .map((user) => ({ ...user, isBlocked: Boolean(user.isBlocked) }));

  res.json({ users });
});

app.post("/api/users/:userId/block", requireAuth, requireRole(privilegedUserAdminRoles), (req, res) => {
  const { userId } = req.params;
  const { reason = "Blocked by administrator." } = req.body ?? {};

  if (Number(userId) === req.user.id) {
    return res.status(400).json({ error: "You cannot block your own account." });
  }

  const target = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(userId);
  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  db.prepare("UPDATE users SET is_blocked = 1, blocked_reason = ? WHERE id = ?").run(String(reason).trim(), userId);
  createNotification(target.id, "account_blocked", "Your account was blocked", String(reason).trim(), "user", Number(userId));
  void sendEmailNotification(target.email, "Your Innovation Platform account was blocked", String(reason).trim());

  res.json({ ok: true });
});

app.post("/api/users/:userId/unblock", requireAuth, requireRole(privilegedUserAdminRoles), (req, res) => {
  const { userId } = req.params;
  const target = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId);
  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  db.prepare("UPDATE users SET is_blocked = 0, blocked_reason = NULL WHERE id = ?").run(userId);
  createNotification(target.id, "account_unblocked", "Your account was reactivated", "Your Innovation Platform account is active again.", "user", Number(userId));
  void sendEmailNotification(target.email, "Your Innovation Platform account is active again", "Your account is active again.");

  res.json({ ok: true });
});

app.post("/api/users/:userId/reset-password", requireAuth, requireRole(privilegedUserAdminRoles), (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body ?? {};

  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "A new password with at least 8 characters is required." });
  }

  const target = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId);
  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(String(newPassword), 10), userId);
  createNotification(target.id, "password_reset", "Your password was reset", "An administrator reset your password. Please use the new password provided to you.", "user", Number(userId));
  void sendEmailNotification(target.email, "Your password was reset", "An administrator reset your password for the Innovation Platform.");

  res.json({ ok: true });
});

app.delete("/api/users/:userId", requireAuth, requireRole(privilegedUserAdminRoles), (req, res) => {
  const { userId } = req.params;

  if (Number(userId) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!target) {
    return res.status(404).json({ error: "User not found." });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  res.json({ ok: true });
});

app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const { message, language = "en" } = req.body ?? {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "A message is required." });
    }

    const result = await getOpenAiChatResponse(req.user, language, String(message).trim());
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to generate AI response.",
    });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api\/).*/, (_req, res) => {
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Innovation Center server listening on http://localhost:${port}`);
});
