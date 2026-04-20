import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import { DB_SCHEMA, initializeDatabase, pool } from "../server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sqlitePath = path.join(rootDir, "server", "data", "innovation-center.db");
const schemaPrefix = `"${DB_SCHEMA}".`;

function setSequenceSql(tableName) {
  return `
    SELECT setval(
      pg_get_serial_sequence('${schemaPrefix}${tableName}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${schemaPrefix}${tableName}), 1),
      COALESCE((SELECT MAX(id) FROM ${schemaPrefix}${tableName}) IS NOT NULL, false)
    )
  `;
}

async function main() {
  await initializeDatabase({ seed: false });

  const sqlite = new Database(sqlitePath, { readonly: true });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        ${schemaPrefix}reviews,
        ${schemaPrefix}notifications,
        ${schemaPrefix}ideas,
        ${schemaPrefix}challenges,
        ${schemaPrefix}users
      RESTART IDENTITY CASCADE
    `);

    const users = sqlite.prepare("SELECT * FROM users ORDER BY id").all();
    for (const user of users) {
      await client.query(
        `
          INSERT INTO ${schemaPrefix}users
            (id, name, email, password_hash, role, organization, is_blocked, blocked_reason, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          user.id,
          user.name,
          user.email,
          user.password_hash,
          user.role,
          user.organization,
          Boolean(user.is_blocked),
          user.blocked_reason,
          user.created_at,
        ],
      );
    }

    const challenges = sqlite.prepare("SELECT * FROM challenges ORDER BY id").all();
    for (const challenge of challenges) {
      await client.query(
        `
          INSERT INTO ${schemaPrefix}challenges
            (id, title, summary, scope, objectives, owner_department, status, created_by, selected_idea_id, created_at, updated_at, closed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          challenge.id,
          challenge.title,
          challenge.summary,
          challenge.scope,
          challenge.objectives,
          challenge.owner_department,
          challenge.status,
          challenge.created_by,
          challenge.selected_idea_id,
          challenge.created_at,
          challenge.updated_at,
          challenge.closed_at,
        ],
      );
    }

    const ideas = sqlite.prepare("SELECT * FROM ideas ORDER BY id").all();
    for (const idea of ideas) {
      await client.query(
        `
          INSERT INTO ${schemaPrefix}ideas
            (id, challenge_id, title, summary, value_proposition, implementation_plan, status, submitter_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          idea.id,
          idea.challenge_id,
          idea.title,
          idea.summary,
          idea.value_proposition,
          idea.implementation_plan,
          idea.status,
          idea.submitter_id,
          idea.created_at,
          idea.updated_at,
        ],
      );
    }

    const reviews = sqlite.prepare("SELECT * FROM reviews ORDER BY id").all();
    for (const review of reviews) {
      await client.query(
        `
          INSERT INTO ${schemaPrefix}reviews
            (id, idea_id, reviewer_id, decision, notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          review.id,
          review.idea_id,
          review.reviewer_id,
          review.decision,
          review.notes,
          review.created_at,
        ],
      );
    }

    const notifications = sqlite.prepare("SELECT * FROM notifications ORDER BY id").all();
    for (const notification of notifications) {
      await client.query(
        `
          INSERT INTO ${schemaPrefix}notifications
            (id, user_id, type, title, body, related_type, related_id, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          notification.id,
          notification.user_id,
          notification.type,
          notification.title,
          notification.body,
          notification.related_type,
          notification.related_id,
          Boolean(notification.is_read),
          notification.created_at,
        ],
      );
    }

    await client.query(setSequenceSql("users"));
    await client.query(setSequenceSql("challenges"));
    await client.query(setSequenceSql("ideas"));
    await client.query(setSequenceSql("reviews"));
    await client.query(setSequenceSql("notifications"));

    await client.query("COMMIT");
    console.log(`Migrated SQLite data into schema "${DB_SCHEMA}".`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    sqlite.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
