export interface Evidence {
  id?: string; // We will generate an ID if not present
  fact: string;
  source: string;
}

export interface ClaimConflict {
  claim: string;
  conflictingEvidenceIds: string[];
  severity: "blocking" | "warning";
  safeAlternative?: string;
}

export interface CandidateAngle {
  id: string;
  intent: "announcement" | "feature" | "decision" | "problem" | "lesson" | "expertise" | "feedback" | "custom";
  title: string;
  angleSummary: string;
  audience: "developers" | "technical_leads" | "recruiters" | "potential_users" | "contributors" | "professional_network";
  audienceValue: string;
  evidenceIds: string[];
  supportLevel: "verified" | "partial" | "human_context_required";
  humanInsightGap?: string;
  requiresHumanContext: boolean;
  adaptiveQuestion?: string;
  recommended: boolean;
  tone: "calm" | "confident" | "bold";
  claimRisk: "low" | "medium" | "high";
}

export interface AnalysisTokenPayload {
  version: number;
  repository: string;
  lang: string;
  intent: string;
  angles: CandidateAngle[];
  atomicFacts: Evidence[];
  conflicts: ClaimConflict[];
  issuedAt: number;
  expiresAt: number;
  audience: "demo" | "authenticated";
  userId?: string;
}

export interface AnalyzeRequest {
  repoUrl: string;
  intent: string;
  lang: "ar" | "en" | "de";
}

export interface AnalyzeResponse {
  repository: string;
  angles: CandidateAngle[];
  conflicts: Pick<ClaimConflict, "claim" | "severity" | "safeAlternative">[];
  analysisToken: string;
}

export interface GenerateRequest {
  analysisToken: string;
  angleId?: string;
  customAngle?: string;
}

export interface GenerateResponse {
  post: string;
  suggestedComment?: string;
  evidence: Evidence[];
  usedEvidenceIds: string[];
  warnings: string[];
  claimAudit?: import('../deepIntelligence/claimAudit').ClaimAudit;
}
