async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload;
}

export const api = {
  login(credentials) {
    return request("/auth/login", { method: "POST", body: credentials });
  },
  register(data) {
    return request("/auth/register", { method: "POST", body: data });
  },
  me(token) {
    return request("/auth/me", { token });
  },
  dashboard(token) {
    return request("/dashboard", { token });
  },
  challenges(token) {
    return request("/challenges", { token });
  },
  challengeDetails(token, challengeId) {
    return request(`/challenges/${challengeId}`, { token });
  },
  createChallenge(token, body) {
    return request("/challenges", { method: "POST", token, body });
  },
  updateChallenge(token, challengeId, body) {
    return request(`/challenges/${challengeId}`, { method: "PUT", token, body });
  },
  deleteChallenge(token, challengeId) {
    return request(`/challenges/${challengeId}`, { method: "DELETE", token });
  },
  closeChallenge(token, challengeId, body) {
    return request(`/challenges/${challengeId}/close`, { method: "POST", token, body });
  },
  submitIdea(token, body) {
    return request("/ideas", { method: "POST", token, body });
  },
  updateIdea(token, ideaId, body) {
    return request(`/ideas/${ideaId}`, { method: "PUT", token, body });
  },
  deleteIdea(token, ideaId) {
    return request(`/ideas/${ideaId}`, { method: "DELETE", token });
  },
  myIdeas(token) {
    return request("/ideas/mine", { token });
  },
  reviewQueue(token) {
    return request("/reviews/pending", { token });
  },
  reviewIdea(token, ideaId, body) {
    return request(`/ideas/${ideaId}/reviews`, { method: "POST", token, body });
  },
  notifications(token) {
    return request("/notifications", { token });
  },
  markNotificationRead(token, notificationId) {
    return request(`/notifications/${notificationId}/read`, { method: "POST", token });
  },
  adminOverview(token) {
    return request("/admin/overview", { token });
  },
  users(token) {
    return request("/users", { token });
  },
  blockUser(token, userId, body) {
    return request(`/users/${userId}/block`, { method: "POST", token, body });
  },
  unblockUser(token, userId) {
    return request(`/users/${userId}/unblock`, { method: "POST", token });
  },
  resetUserPassword(token, userId, body) {
    return request(`/users/${userId}/reset-password`, { method: "POST", token, body });
  },
  deleteUser(token, userId) {
    return request(`/users/${userId}`, { method: "DELETE", token });
  },
  chat(token, body) {
    return request("/chat", { method: "POST", token, body });
  },
};
