export interface Agent {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  status: "active" | "paused" | "requires_attention";
  riskScore: number;
  systemTargets: string[];
  descriptionEn: string;
  descriptionAr: string;
  lastActive: string;
}

export interface AgentAction {
  id: string;
  agentId: string;
  agentNameEn: string;
  agentNameAr: string;
  systemTarget: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  actionTypeEn: string;
  actionTypeAr: string;
  detailsEn: string;
  detailsAr: string;
  status: "proposed" | "pending_review" | "approved" | "blocked" | "executed" | "escalated" | "failed";
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  escalationNotesEn?: string;
  escalationNotesAr?: string;
  complianceScore?: number;
  aiMitigationEn?: string;
  aiMitigationAr?: string;
}

export interface Log {
  id: string;
  timestamp: string;
  actor: string;
  actionId?: string;
  eventEn: string;
  eventAr: string;
  detailsEn: string;
  detailsAr: string;
  type: "info" | "warning" | "error" | "approval" | "escalation" | "block";
}

export interface UserSettings {
  githubUsername?: string;
  globalWorkforceStatus?: "active" | "paused";
  stripeThreshold?: number;
  githubThreshold?: number;
  awsThreshold?: number;
}
