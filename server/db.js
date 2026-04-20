import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local", override: false });

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

const rawSchema = process.env.DB_SCHEMA || "momah";
export const DB_SCHEMA = rawSchema.replace(/[^a-zA-Z0-9_]/g, "") || "momah";
const schemaPrefix = `"${DB_SCHEMA}".`;
const tableNames = ["users", "challenges", "ideas", "reviews", "notifications"];

function normalizeDatabaseUrl() {
  const jdbcUrl = process.env.JDBC_DATABASE_URL || "";
  const directUrl = process.env.DATABASE_URL || "";

  if (directUrl) {
    return directUrl.startsWith("jdbc:postgresql://")
      ? directUrl.replace(/^jdbc:postgresql:\/\//, "postgresql://")
      : directUrl;
  }

  if (jdbcUrl) {
    return jdbcUrl.replace(/^jdbc:postgresql:\/\//, "postgresql://");
  }

  return "";
}

function buildPoolConfig() {
  const databaseUrl = normalizeDatabaseUrl();
  const sslEnabled = process.env.PGSSL !== "false";

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "postgres",
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };
}

export const pool = new Pool(buildPoolConfig());

function qualifyTables(sql) {
  let qualified = sql;
  for (const tableName of tableNames) {
    qualified = qualified.replace(new RegExp(`\\b${tableName}\\b`, "g"), `${schemaPrefix}${tableName}`);
  }
  return qualified;
}

function toPgSql(sql) {
  let index = 0;
  return qualifyTables(sql).replace(/\?/g, () => `$${++index}`);
}

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

export async function query(sql, params = [], client = pool) {
  return client.query(toPgSql(sql), params);
}

export async function get(sql, params = [], client = pool) {
  const result = await query(sql, params, client);
  return result.rows[0] ?? null;
}

export async function all(sql, params = [], client = pool) {
  const result = await query(sql, params, client);
  return result.rows;
}

export async function run(sql, params = [], client = pool) {
  const trimmed = sql.trim();
  const shouldReturnId = /^insert\s+/i.test(trimmed) && !/\breturning\b/i.test(trimmed);
  const finalSql = shouldReturnId ? `${trimmed} RETURNING id` : trimmed;
  const result = await query(finalSql, params, client);

  return {
    changes: result.rowCount,
    lastInsertRowid: result.rows[0]?.id ?? null,
    rows: result.rows,
  };
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedUsers(client) {
  const countRow = await get("SELECT COUNT(*)::int AS count FROM users", [], client);
  if ((countRow?.count ?? 0) > 0) return;

  const users = [
    {
      name: "Platform Admin",
      email: "admin@momah.sa",
      passwordHash: bcrypt.hashSync("Admin123!", 10),
      role: ROLES.admin,
      organization: "Ministry of Municipalities and Housing",
    },
    {
      name: "Innovation Director",
      email: "director@momah.sa",
      passwordHash: bcrypt.hashSync("Director123!", 10),
      role: ROLES.innovationDirector,
      organization: "Innovation Center",
    },
    {
      name: "Innovation Staff",
      email: "staff@momah.sa",
      passwordHash: bcrypt.hashSync("Staff123!", 10),
      role: ROLES.innovationStaff,
      organization: "Innovation Center",
    },
    {
      name: "Innovation Expert",
      email: "expert@momah.sa",
      passwordHash: bcrypt.hashSync("Expert123!", 10),
      role: ROLES.innovationExpert,
      organization: "Innovation Center",
    },
    {
      name: "Sector Challenge Owner",
      email: "sector@momah.sa",
      passwordHash: bcrypt.hashSync("Sector123!", 10),
      role: ROLES.sectorOwner,
      organization: "Municipal Sector",
    },
    {
      name: "Public Innovator",
      email: "citizen@example.com",
      passwordHash: bcrypt.hashSync("Idea123!", 10),
      role: ROLES.publicUser,
      organization: "Independent",
    },
    {
      name: "Partner Entity",
      email: "partner@example.com",
      passwordHash: bcrypt.hashSync("Partner123!", 10),
      role: ROLES.partnerEntity,
      organization: "GovTech Partner",
    },
  ];

  for (const user of users) {
    await run(
      `
        INSERT INTO users (name, email, password_hash, role, organization)
        VALUES (?, ?, ?, ?, ?)
      `,
      [user.name, user.email, user.passwordHash, user.role, user.organization],
      client,
    );
  }
}

async function seedChallenges(client) {
  const countRow = await get("SELECT COUNT(*)::int AS count FROM challenges", [], client);
  if ((countRow?.count ?? 0) > 0) return;

  const director = await get("SELECT id FROM users WHERE role = ?", [ROLES.innovationDirector], client);
  const sectorOwner = await get("SELECT id FROM users WHERE role = ?", [ROLES.sectorOwner], client);
  const creatorId = director?.id ?? sectorOwner?.id ?? 1;

  const challenges = [
    {
      title: "Smart automation for high-volume municipal services",
      summary:
        "Design a practical automation model that reduces manual service handling time while preserving governance and service quality.",
      scope:
        "Map repetitive municipal transactions, propose automation opportunities, define operational controls, and identify a pilot candidate service with measurable impact.",
      objectives:
        "Reduce cycle time, improve citizen experience, and prepare a safe pilot plan that can be executed with ministry stakeholders.",
      ownerDepartment: "Municipal Sector",
    },
    {
      title: "Regulatory sandbox for shadow shops",
      summary:
        "Shape a controlled innovation sandbox to test formalization pathways, compliance support, and digital services for shadow-shop activity before full legalization.",
      scope:
        "Assess the current informal market, define sandbox eligibility criteria, propose legal and operational guardrails, and identify digital services needed to support pilot onboarding.",
      objectives:
        "Create a policy-ready challenge scope that helps the ministry study legalization options, reduce risk, and test regulated participation models.",
      ownerDepartment: "Innovation Center",
    },
    {
      title: "Unified beneficiary journey across digital channels",
      summary:
        "Improve the end-to-end service journey across ministry channels through better guidance, tracking, and experience design.",
      scope:
        "Review target journeys, define pain points, recommend service redesign opportunities, and prepare a phased implementation roadmap.",
      objectives:
        "Increase completion rates, reduce drop-off, and create a clearer digital experience for beneficiaries.",
      ownerDepartment: "Digital Transformation Agency",
    },
  ];

  for (const challenge of challenges) {
    await run(
      `
        INSERT INTO challenges (title, summary, scope, objectives, owner_department, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [challenge.title, challenge.summary, challenge.scope, challenge.objectives, challenge.ownerDepartment, creatorId],
      client,
    );
  }
}

async function seedIdeas(client) {
  const countRow = await get("SELECT COUNT(*)::int AS count FROM ideas", [], client);
  if ((countRow?.count ?? 0) > 0) return;

  const publicUser = await get("SELECT id FROM users WHERE role = ?", [ROLES.publicUser], client);
  const partnerUser = await get("SELECT id FROM users WHERE role = ?", [ROLES.partnerEntity], client);
  const challenges = await all("SELECT id, title FROM challenges ORDER BY id", [], client);

  if (!publicUser || !challenges.length) return;

  const seedIdeasData = [
    {
      challengeId: challenges[0].id,
      title: "Citizen-facing automation cockpit",
      summary:
        "A workflow cockpit that triages requests, auto-generates responses, and routes edge cases to the right municipal team.",
      valueProposition:
        "Reduces repetitive workload and provides faster service updates for citizens and frontline staff.",
      implementationPlan:
        "Start with two high-volume services, build workflow rules, integrate analytics, and expand based on measured service improvements.",
      status: "under_review",
      submitterId: publicUser.id,
    },
    {
      challengeId: challenges[1].id,
      title: "Sandbox enrollment and compliance support portal",
      summary:
        "A guided onboarding portal that helps shadow shops join the sandbox, understand obligations, and submit operational data safely.",
      valueProposition:
        "Improves ministry visibility into sandbox participation while lowering barriers for informal operators to join a regulated pilot.",
      implementationPlan:
        "Pilot with one city, define registration flows, capture structured operating data, and provide compliance nudges through a digital dashboard.",
      status: "submitted",
      submitterId: partnerUser?.id ?? publicUser.id,
    },
  ];

  for (const idea of seedIdeasData) {
    await run(
      `
        INSERT INTO ideas (challenge_id, title, summary, value_proposition, implementation_plan, status, submitter_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        idea.challengeId,
        idea.title,
        idea.summary,
        idea.valueProposition,
        idea.implementationPlan,
        idea.status,
        idea.submitterId,
      ],
      client,
    );
  }
}

export async function initializeDatabase({ seed = true } = {}) {
  await withTransaction(async (client) => {
    const schemaRow = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1", [DB_SCHEMA]);
    if (!schemaRow.rows.length) {
      throw new Error(`Database schema "${DB_SCHEMA}" does not exist or is not accessible for this user.`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        organization TEXT,
        is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
        blocked_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        scope TEXT NOT NULL,
        objectives TEXT NOT NULL,
        owner_department TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_by INTEGER NOT NULL REFERENCES ${schemaPrefix}users(id) ON DELETE CASCADE,
        selected_idea_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}ideas (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES ${schemaPrefix}challenges(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        value_proposition TEXT NOT NULL,
        implementation_plan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        submitter_id INTEGER NOT NULL REFERENCES ${schemaPrefix}users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}reviews (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ${schemaPrefix}ideas(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES ${schemaPrefix}users(id) ON DELETE CASCADE,
        decision TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES ${schemaPrefix}users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        related_type TEXT,
        related_id INTEGER,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE ${schemaPrefix}challenges
      DROP CONSTRAINT IF EXISTS challenges_selected_idea_id_fkey
    `);

    await client.query(`
      ALTER TABLE ${schemaPrefix}challenges
      ADD CONSTRAINT challenges_selected_idea_id_fkey
      FOREIGN KEY (selected_idea_id) REFERENCES ${schemaPrefix}ideas(id) ON DELETE SET NULL
    `).catch(() => {});

    if (seed) {
      await seedUsers(client);
      await seedChallenges(client);
      await seedIdeas(client);
    }
  });
}
