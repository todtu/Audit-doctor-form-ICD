import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ICDResult {
  code: string;
  description: string;
}

export interface DiagnosticInsight {
  summary: string;
  recommendations: string[];
}

export async function searchICD(query: string, type: 'ICD10' | 'ICD9'): Promise<ICDResult[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for ${type} codes and descriptions matching: "${query}". Return as a JSON array of objects with "code" and "description" fields.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["code", "description"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function getDiagnosticInsights(diagnosis: string, icd10: string[], icd9: string[]): Promise<DiagnosticInsight> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following diagnosis and codes:
Diagnosis: ${diagnosis}
ICD-10: ${icd10.join(", ")}
ICD-9: ${icd9.join(", ")}

Provide a summary of the clinical condition and recommendations for audit accuracy. Return as JSON with "summary" and "recommendations" (array of strings).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["summary", "recommendations"],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{"summary": "", "recommendations": []}');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { summary: "Unable to generate insights.", recommendations: [] };
  }
}
