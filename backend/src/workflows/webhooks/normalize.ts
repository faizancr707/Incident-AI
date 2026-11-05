import { v4 as uuidv4 } from "uuid";
import { WorkflowEvent, WorkflowEventType } from "../types";

/**
 * Normalizes GitHub webhook events into the unified WorkflowEvent format.
 */
export function normalizeGitHubEvent(eventHeader: string, payload: Record<string, any>): WorkflowEvent {
  const eventId = payload.delivery_id || payload.guid || uuidv4();
  const repo = payload.repository || {};
  const sender = payload.sender || {};
  const action = payload.action || "push";

  let eventType: WorkflowEventType = "push";
  if (eventHeader === "pull_request") eventType = "pull_request";
  else if (eventHeader === "pull_request_review") eventType = "pull_request_review";
  else if (eventHeader === "deployment") eventType = "deployment";
  else if (eventHeader === "deployment_status") eventType = "deployment_status";
  else if (eventHeader === "check_suite") eventType = "check_suite";
  else if (eventHeader === "check_run") eventType = "check_run";
  else if (eventHeader === "push") eventType = "push";

  const event: WorkflowEvent = {
    id: eventId,
    provider: "github",
    eventType,
    action,
    repository: {
      name: repo.name || "unknown-repo",
      fullName: repo.full_name || repo.name || "unknown-org/unknown-repo",
      url: repo.html_url || repo.url || "",
      defaultBranch: repo.default_branch || "main",
    },
    sender: {
      id: String(sender.id || "0"),
      login: sender.login || "unknown-user",
      avatarUrl: sender.avatar_url,
    },
    payload,
    ref: payload.ref,
    commitSha: payload.after || (payload.head_commit && payload.head_commit.id) || payload.sha,
    timestamp: new Date(),
    receivedAt: new Date(),
  };

  if (payload.pull_request) {
    const pr = payload.pull_request;
    event.pullRequest = {
      number: pr.number,
      title: pr.title || "",
      state: pr.state || "open",
      url: pr.html_url || "",
      baseBranch: pr.base?.ref || "main",
      headBranch: pr.head?.ref || "feature",
    };
    if (!event.commitSha && pr.head?.sha) {
      event.commitSha = pr.head.sha;
    }
  }

  if (payload.deployment) {
    const d = payload.deployment;
    event.deployment = {
      id: String(d.id),
      environment: d.environment || "production",
      url: d.url || payload.deployment_status?.target_url,
      status: payload.deployment_status?.state || "pending",
    };
  }

  return event;
}

/**
 * Normalizes GitLab webhook events into the unified WorkflowEvent format.
 */
export function normalizeGitLabEvent(eventHeader: string, payload: Record<string, any>): WorkflowEvent {
  const eventId = payload.event_id || uuidv4();
  const project = payload.project || {};
  const user = payload.user || { name: payload.user_name, username: payload.user_username, avatar_url: payload.user_avatar };
  const objectKind = payload.object_kind || eventHeader || "push";

  let eventType: WorkflowEventType = "push";
  let action = "event";

  if (objectKind === "merge_request") {
    eventType = "merge_request";
    action = payload.object_attributes?.action || "opened";
  } else if (objectKind === "pipeline") {
    eventType = "pipeline";
    action = payload.object_attributes?.status || "pending";
  } else if (objectKind === "deployment") {
    eventType = "deployment";
    action = payload.status || "created";
  } else if (objectKind === "tag_push") {
    eventType = "tag_push";
    action = "push";
  } else {
    eventType = "push";
    action = "push";
  }

  const event: WorkflowEvent = {
    id: eventId,
    provider: "gitlab",
    eventType,
    action,
    repository: {
      name: project.name || "gitlab-repo",
      fullName: project.path_with_namespace || project.name || "gitlab-org/repo",
      url: project.web_url || project.homepage || "",
      defaultBranch: project.default_branch || "main",
    },
    sender: {
      id: String(payload.user_id || user.id || "0"),
      login: user.username || payload.user_username || payload.user_name || "gitlab-user",
      avatarUrl: user.avatar_url || payload.user_avatar,
    },
    payload,
    ref: payload.ref,
    commitSha: payload.checkout_sha || payload.after || (payload.commit && payload.commit.id),
    timestamp: new Date(),
    receivedAt: new Date(),
  };

  if (payload.object_attributes && objectKind === "merge_request") {
    const mr = payload.object_attributes;
    event.pullRequest = {
      number: mr.iid || mr.id,
      title: mr.title || "",
      state: mr.state || "opened",
      url: mr.url || "",
      baseBranch: mr.target_branch || "main",
      headBranch: mr.source_branch || "feature",
    };
  }

  if (payload.object_attributes && objectKind === "pipeline") {
    const pipe = payload.object_attributes;
    event.pipeline = {
      id: String(pipe.id),
      status: pipe.status || "pending",
      url: payload.project?.web_url ? `${payload.project.web_url}/pipelines/${pipe.id}` : undefined,
      stages: pipe.stages || [],
    };
  }

  return event;
}

/**
 * Normalizes Vercel webhook events into the unified WorkflowEvent format.
 */
export function normalizeVercelEvent(eventTypeHeader: string, payload: Record<string, any>): WorkflowEvent {
  const eventId = payload.id || uuidv4();
  const deploymentData = payload.payload?.deployment || payload.deployment || {};
  const project = payload.payload?.project || payload.project || {};
  const user = payload.payload?.user || payload.user || {};
  const rawType = payload.type || eventTypeHeader || "deployment.created";

  let eventType: WorkflowEventType = "deployment";
  if (rawType.includes("ready") || rawType.includes("succeeded")) {
    eventType = "deployment_ready";
  } else if (rawType.includes("status")) {
    eventType = "deployment_status";
  }

  const repoName = deploymentData.meta?.githubRepo || project.name || "vercel-app";
  const repoFullName = deploymentData.meta?.githubCommitOrg
    ? `${deploymentData.meta.githubCommitOrg}/${repoName}`
    : repoName;

  const event: WorkflowEvent = {
    id: eventId,
    provider: "vercel",
    eventType,
    action: rawType,
    repository: {
      name: repoName,
      fullName: repoFullName,
      url: deploymentData.meta?.githubCommitOrg
        ? `https://github.com/${repoFullName}`
        : deploymentData.url ? `https://${deploymentData.url}` : "",
      defaultBranch: "main",
    },
    sender: {
      id: String(user.id || "0"),
      login: user.username || deploymentData.meta?.githubCommitAuthorName || "vercel-user",
      avatarUrl: user.avatar,
    },
    payload,
    ref: deploymentData.meta?.githubCommitRef ? `refs/heads/${deploymentData.meta.githubCommitRef}` : undefined,
    commitSha: deploymentData.meta?.githubCommitSha,
    deployment: {
      id: deploymentData.id || String(eventId),
      environment: deploymentData.target || "production",
      url: deploymentData.url ? `https://${deploymentData.url}` : undefined,
      status: deploymentData.readyState || deploymentData.status || "BUILDING",
    },
    timestamp: new Date(),
    receivedAt: new Date(),
  };

  return event;
}

/**
 * Unified event normalizer router.
 */
export function normalizeEvent(provider: "github" | "gitlab" | "vercel", eventType: string, payload: Record<string, any>): WorkflowEvent {
  switch (provider) {
    case "github":
      return normalizeGitHubEvent(eventType, payload);
    case "gitlab":
      return normalizeGitLabEvent(eventType, payload);
    case "vercel":
      return normalizeVercelEvent(eventType, payload);
    default:
      throw new Error(`Unsupported webhook provider: ${provider}`);
  }
}
