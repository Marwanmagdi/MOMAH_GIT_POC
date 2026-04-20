import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "innovation-center.db");

fs.mkdirSync(dataDir, { recursive: true });

export const ROLES = {
  admin: "admin",
  innovationDirector: "innovation_director",
  innovationStaff: "innovation_staff",
  innovationExpert: "innovation_expert",
  sectorOwner: "sector_owner",
  publicUser: "public_user",
  partnerEntity: "partner_entity",
};

export const MINISTRY_CHALLENGE_ROLES = [
  ROLES.admin,
  ROLES.innovationDirector,
  ROLES.innovationStaff,
  ROLES.sectorOwner,
];

export const REVIEWER_ROLES = [
  ROLES.admin,
  ROLES.innovationDirector,
  ROLES.innovationStaff,
  ROLES.innovationExpert,
];

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    organization TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    scope TEXT NOT NULL,
    objectives TEXT NOT NULL,
    owner_department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    value_proposition TEXT NOT NULL,
    implementation_plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    submitter_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idea_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    decision TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_type TEXT,
    related_id INTEGER,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function ensureColumn(tableName, columnName, sqlDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlDefinition}`);
  }
}

ensureColumn("users", "is_blocked", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("users", "blocked_reason", "TEXT");
ensureColumn("ideas", "updated_at", "TEXT");
ensureColumn("challenges", "selected_idea_id", "INTEGER");
ensureColumn("challenges", "closed_at", "TEXT");
ensureColumn("challenges", "updated_at", "TEXT");

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, organization)
    VALUES (@name, @email, @password_hash, @role, @organization)
  `);

  const users = [
    {
      name: "Platform Admin",
      email: "admin@momah.sa",
      password_hash: bcrypt.hashSync("Admin123!", 10),
      role: ROLES.admin,
      organization: "Ministry of Municipalities and Housing",
    },
    {
      name: "Innovation Director",
      email: "director@momah.sa",
      password_hash: bcrypt.hashSync("Director123!", 10),
      role: ROLES.innovationDirector,
      organization: "Innovation Center",
    },
    {
      name: "Innovation Staff",
      email: "staff@momah.sa",
      password_hash: bcrypt.hashSync("Staff123!", 10),
      role: ROLES.innovationStaff,
      organization: "Innovation Center",
    },
    {
      name: "Innovation Expert",
      email: "expert@momah.sa",
      password_hash: bcrypt.hashSync("Expert123!", 10),
      role: ROLES.innovationExpert,
      organization: "Innovation Center",
    },
    {
      name: "Sector Challenge Owner",
      email: "sector@momah.sa",
      password_hash: bcrypt.hashSync("Sector123!", 10),
      role: ROLES.sectorOwner,
      organization: "Municipal Sector",
    },
    {
      name: "Public Innovator",
      email: "citizen@example.com",
      password_hash: bcrypt.hashSync("Idea123!", 10),
      role: ROLES.publicUser,
      organization: "Independent",
    },
    {
      name: "Partner Entity",
      email: "partner@example.com",
      password_hash: bcrypt.hashSync("Partner123!", 10),
      role: ROLES.partnerEntity,
      organization: "GovTech Partner",
    },
  ];

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insertUser.run(item);
    }
  });

  transaction(users);
}

function seedChallenges() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM challenges").get().count;
  if (count > 0) return;

  const director = db.prepare("SELECT id FROM users WHERE role = ?").get(ROLES.innovationDirector);
  const sectorOwner = db.prepare("SELECT id FROM users WHERE role = ?").get(ROLES.sectorOwner);
  const creatorId = director?.id ?? sectorOwner?.id ?? 1;

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (title, summary, scope, objectives, owner_department, created_by)
    VALUES (@title, @summary, @scope, @objectives, @owner_department, @created_by)
  `);

  const challenges = [
    {
      title: "Smart automation for high-volume municipal services",
      summary:
        "Design a practical automation model that reduces manual service handling time while preserving governance and service quality.",
      scope:
        "Map repetitive municipal transactions, propose automation opportunities, define operational controls, and identify a pilot candidate service with measurable impact.",
      objectives:
        "Reduce cycle time, improve citizen experience, and prepare a safe pilot plan that can be executed with ministry stakeholders.",
      owner_department: "Municipal Sector",
      created_by: creatorId,
    },
    {
      title: "Regulatory sandbox for shadow shops",
      summary:
        "Shape a controlled innovation sandbox to test formalization pathways, compliance support, and digital services for shadow-shop activity before full legalization.",
      scope:
        "Assess the current informal market, define sandbox eligibility criteria, propose legal and operational guardrails, and identify digital services needed to support pilot onboarding.",
      objectives:
        "Create a policy-ready challenge scope that helps the ministry study legalization options, reduce risk, and test regulated participation models.",
      owner_department: "Innovation Center",
      created_by: creatorId,
    },
    {
      title: "Unified beneficiary journey across digital channels",
      summary:
        "Improve the end-to-end service journey across ministry channels through better guidance, tracking, and experience design.",
      scope:
        "Review target journeys, define pain points, recommend service redesign opportunities, and prepare a phased implementation roadmap.",
      objectives:
        "Increase completion rates, reduce drop-off, and create a clearer digital experience for beneficiaries.",
      owner_department: "Digital Transformation Agency",
      created_by: creatorId,
    },
  ];

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insertChallenge.run(item);
    }
  });

  transaction(challenges);
}

function seedIdeas() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM ideas").get().count;
  if (count > 0) return;

  const publicUser = db.prepare("SELECT id FROM users WHERE role = ?").get(ROLES.publicUser);
  const partnerUser = db.prepare("SELECT id FROM users WHERE role = ?").get(ROLES.partnerEntity);
  const challenges = db.prepare("SELECT id, title FROM challenges ORDER BY id").all();

  if (!publicUser || challenges.length === 0) {
    return;
  }

  const insertIdea = db.prepare(`
    INSERT INTO ideas (challenge_id, title, summary, value_proposition, implementation_plan, status, submitter_id)
    VALUES (@challenge_id, @title, @summary, @value_proposition, @implementation_plan, @status, @submitter_id)
  `);

  const seedIdeasData = [
    {
      challenge_id: challenges[0].id,
      title: "Citizen-facing automation cockpit",
      summary:
        "A workflow cockpit that triages requests, auto-generates responses, and routes edge cases to the right municipal team.",
      value_proposition:
        "Reduces repetitive workload and provides faster service updates for citizens and frontline staff.",
      implementation_plan:
        "Start with two high-volume services, build workflow rules, integrate analytics, and expand based on measured service improvements.",
      status: "under_review",
      submitter_id: publicUser.id,
    },
    {
      challenge_id: challenges[1].id,
      title: "Sandbox enrollment and compliance support portal",
      summary:
        "A guided onboarding portal that helps shadow shops join the sandbox, understand obligations, and submit operational data safely.",
      value_proposition:
        "Improves ministry visibility into sandbox participation while lowering barriers for informal operators to join a regulated pilot.",
      implementation_plan:
        "Pilot with one city, define registration flows, capture structured operating data, and provide compliance nudges through a digital dashboard.",
      status: "submitted",
      submitter_id: partnerUser?.id ?? publicUser.id,
    },
  ];

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insertIdea.run(item);
    }
  });

  transaction(seedIdeasData);
}

seedUsers();
seedChallenges();
seedIdeas();

export function serializeUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization,
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? 0),
    blockedReason: row.blocked_reason ?? row.blockedReason ?? null,
  };
}
