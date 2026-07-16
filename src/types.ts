export interface Agent {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  status: "active" | "paused" | "requires_attention";
  riskScore: number; // 0 to 100
  systemTargets: string[]; // e.g. ["stripe", "github", "aws", "slack"]
  descriptionEn: string;
  descriptionAr: string;
  lastActive: string;
}

export interface AgentAction {
  id: string;
  agentId: string;
  agentNameEn: string;
  agentNameAr: string;
  systemTarget: string; // e.g., "stripe", "github", "aws", "slack"
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
  complianceScore?: number; // 0 to 100
  aiMitigationEn?: string;
  aiMitigationAr?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string; // e.g., Agent Name or Human Email
  actionId?: string;
  eventEn: string;
  eventAr: string;
  detailsEn: string;
  detailsAr: string;
  type: "info" | "warning" | "error" | "approval" | "escalation" | "block";
}

export interface SystemGateway {
  id: string;
  nameEn: string;
  nameAr: string;
  connected: boolean;
  approvalThreshold: number; // e.g., transactions above $500 require approval
  descriptionEn: string;
  descriptionAr: string;
}
