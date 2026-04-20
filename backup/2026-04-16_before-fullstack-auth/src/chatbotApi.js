export async function requestChatbotReply({ language, message, history, detailChallenge, challenges }) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language,
      message,
      history,
      detailChallenge,
      challenges,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "The AI assistant is currently unavailable.");
  }

  return payload;
}
