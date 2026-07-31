import { Schema, Type } from "@google/genai";

export const analyzeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    atomicFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          fact: { type: Type.STRING },
          source: { type: Type.STRING }
        },
        required: ["id", "fact", "source"]
      }
    },
    storyClusters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          relatedEvidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["topic", "relatedEvidenceIds"]
      }
    },
    internalHypotheses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: {
              total: { type: Type.NUMBER }
            },
            required: ["total"]
          }
        },
        required: ["id", "title", "score"]
      }
    },
    conflicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING },
          conflictingEvidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          safeAlternative: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["warning", "blocking"] }
        },
        required: ["claim", "conflictingEvidenceIds", "severity"]
      }
    },
    finalAngles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          intent: { type: Type.STRING, enum: ["announcement", "feature", "decision", "problem", "lesson", "expertise", "feedback", "custom"] },
          title: { type: Type.STRING },
          angleSummary: { type: Type.STRING },
          audience: { type: Type.STRING, enum: ["developers", "technical_leads", "recruiters", "potential_users", "contributors", "professional_network"] },
          audienceValue: { type: Type.STRING },
          evidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          supportLevel: { type: Type.STRING, enum: ["verified", "partial", "human_context_required"] },
          humanInsightGap: { type: Type.STRING },
          requiresHumanContext: { type: Type.BOOLEAN },
          adaptiveQuestion: { type: Type.STRING },
          recommended: { type: Type.BOOLEAN },
          tone: { type: Type.STRING, enum: ["calm", "confident", "bold"] },
          claimRisk: { type: Type.STRING, enum: ["low", "medium", "high"] }
        },
        required: ["id", "intent", "title", "angleSummary", "audience", "audienceValue", "evidenceIds", "supportLevel", "requiresHumanContext", "recommended", "tone", "claimRisk"]
      }
    }
  },
  required: ["atomicFacts", "storyClusters", "internalHypotheses", "conflicts", "finalAngles"]
};

export const generateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    post: { type: Type.STRING, description: "The generated LinkedIn post" },
    usedEvidenceIds: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "IDs of the evidence facts used in the post" 
    },
    warnings: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Any warnings or deviations from the requested angle" 
    }
  },
  required: ["post", "usedEvidenceIds", "warnings"]
};
