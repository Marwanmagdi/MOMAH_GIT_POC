import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const chatEndpoint = "/api/chat";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function extractResponseText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const fragments = [];

  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (typeof content?.text === "string" && content.text.trim()) {
        fragments.push(content.text.trim());
      }
    }
  }

  return fragments.join("\n").trim();
}

function parseAssistantPayload(rawText, fallbackLanguage) {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      reply: parsed.reply,
      submission: parsed.submission ?? null,
    };
  } catch {
    return {
      reply:
        cleaned ||
        (fallbackLanguage === "ar"
          ? "تعذر تجهيز الرد حالياً. حاول مرة أخرى بعد قليل."
          : "I could not prepare a response right now. Please try again in a moment."),
      submission: null,
    };
  }
}

function createAssistantInstructions(language) {
  const replyLanguage = language === "ar" ? "Arabic" : "English";

  return `
You are the Innovation AI Assistant for a Ministry innovation center prototype.
Respond only in ${replyLanguage}.
Help users understand open challenges, shape ideas, and draft submissions.
Use only the challenge information provided in the request context.
Write like a professional innovation consultant preparing executive-ready content.
Make the answer visually structured and impressive inside a chat interface.
When the user asks for a scope, plan, proposal, or challenge framing, use short section headings and bullet points.
Prefer this structure when helpful:
- Overview
- Challenge Scope
- Objectives
- In Scope
- Out of Scope
- Key Deliverables
- Suggested Phases or Work Plan
- Success Metrics
- Risks and Considerations
Keep each bullet crisp, specific, and practical.
Use plain text only, but format with line breaks, headings, and bullet points so it reads like a polished brief.
Avoid vague filler. Provide concrete scope items, workstreams, and action points.
Create a submission object only when the user explicitly asks to create, submit, log, or draft a challenge or idea request.
Return valid JSON only using this shape:
{
  "reply": "assistant response text",
  "submission": null | {
    "kind": "idea" | "challenge",
    "title": "short submission title",
    "detail": "short supporting detail"
  }
}
`.trim();
}

function createChatPlugin(env) {
  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || "gpt-4.1-mini";

  async function handleChatRequest(req, res, next) {
    if (req.url?.split("?")[0] !== chatEndpoint) {
      return next();
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    if (!apiKey) {
      return sendJson(res, 500, {
        error: "OPENAI_API_KEY is missing. Add it to .env.local before using the chatbot.",
      });
    }

    try {
      const body = await readJsonBody(req);
      const language = body.language === "ar" ? "ar" : "en";
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const challenges = Array.isArray(body.challenges) ? body.challenges : [];
      const detailChallenge = body.detailChallenge ?? null;
      const message = typeof body.message === "string" ? body.message.trim() : "";

      const context = {
        activeChallenge: detailChallenge,
        challenges,
        history,
        userMessage: message,
      };

      const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: createAssistantInstructions(language),
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(context, null, 2),
                },
              ],
            },
          ],
        }),
      });

      const openAiPayload = await openAiResponse.json();

      if (!openAiResponse.ok) {
        return sendJson(res, openAiResponse.status, {
          error:
            openAiPayload?.error?.message ??
            "OpenAI request failed. Check your API key, billing, and model settings.",
        });
      }

      const rawText = extractResponseText(openAiPayload);
      const assistantPayload = parseAssistantPayload(rawText, language);

      return sendJson(res, 200, assistantPayload);
    } catch (error) {
      return sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Unable to process the AI request.",
      });
    }
  }

  return {
    name: "innovation-chatbot-proxy",
    configureServer(server) {
      server.middlewares.use(handleChatRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleChatRequest);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), createChatPlugin(env)],
  };
});
