export interface Evidence {
  id?: string; // We will generate an ID if not present
  fact: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

export interface ClaimConflict {
  claim: string;
  severity: "blocking" | "warning" | "safe";
  safeAlternative: string;
}

export interface CandidateAngle {
  id: string;
  title: string;
  angleSummary: string; // changed from summary to match schema strictly
  audienceValue: string; // changed from professionalValue
  intentMatch: string;
  requiresHumanContext: boolean;
  adaptiveQuestion?: string;
  tone?: "calm" | "confident" | "bold";
  claimRisk?: "low" | "medium" | "high";
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

export interface GenerateResponse {
  post: string;
  usedEvidenceIds: string[];
  warnings: string[];
}
