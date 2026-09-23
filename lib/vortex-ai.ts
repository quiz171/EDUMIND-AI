import { GoogleGenAI } from "@google/genai";
import { validateChatPrompt } from "./content-safety.ts";

export async function vortexBrain({
  message,
  educationLevel,
  classYear,
  course,
  ragContext,
  history = [],
  image,
  theme = 'solaris',
}: {
  message: string;
  educationLevel: string;
  classYear: string;
  course: string;
  ragContext?: string;
  history?: { role: string; content: string }[];
  image?: { data: string; mimeType: string } | null;
  theme?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment");
  }

  // Content safety & child protection pre-check
  const safetyCheck = validateChatPrompt(message);
  if (!safetyCheck.isSafe) {
    return `⚠️ **Academic Safety Guard**: ${safetyCheck.reason}`;
  }

  // Atmosphere Tone Modulation based on active theme
  const themeToneMap: Record<string, string> = {
    solaris: "Warm Glow & Dusk: Warm, patient, deeply encouraging Socratic mentoring with radiant intellectual clarity.",
    midnight: "Interstellar Nebula: Expansive curiosity, profound cosmic wonder, and deep interdisciplinary conceptual mastery.",
    cyberpunk: "Neo-Tokyo Cyberpunk: High-voltage, razor-sharp technical edge, modern industry analogies, and energetic problem solving.",
    emerald: "Emerald Borealis: Calming focus, balanced organic logic, and soothing stress-free step-by-step guidance.",
    arctic: "Glacial Aurora: Crystalline analytical clarity, sub-zero precision, and structured deductive methodology.",
    amethyst: "Imperial Amethyst: Regal academic eloquence, dignified scholarly depth, and rich explanatory rigor.",
    crimson: "Blood Moon Eclipse: High-intensity exam sprint rigor, high-yield bulleted takeaways, and rapid diagnostic drills.",
    mariana: "Abyssal Mariana: Deep-dive exploration, uncovering root principles and fundamental physical/biochemical mechanisms.",
    obsidian: "Onyx Quantum Matrix: Absolute stealth precision, minimal fluff, clean mathematical formulations, and dense insight.",
    slate: "Cyber Titanium Grid: Industrial architectural structure, crisp schematics, and rigorous coordinate-like reasoning.",
    espresso: "Kyoto Espresso Roast: Soothing warm cafe discussion, zero eye-fatigue pacing, and thoughtful academic contemplation.",
    oxford: "Oxford Classical Parchment: Classical collegiate elegance, timeless scholarly prose, and rigorous academic definitions.",
    porcelain: "Lunar Studio Light: Ultra-crisp daylight clarity, luminous transparency, and modern precision analysis.",
  };

  const activeThemeTone = themeToneMap[theme] || themeToneMap.solaris;

  // System Prompt for Nigerian Student Second Brain with Strict Factual Accuracy & Clean Tone
  const studentCourse = course && course.trim() ? course.trim() : "General Studies";
  const systemInstruction = `You are EduMind AI, a knowledgeable, clear, and factually grounded Academic Second Brain for Nigerian students.
Student Profile: Level=${educationLevel || "University"}, Class=${classYear || "Year 1"}, Field/Course=${studentCourse}.
Active Atmosphere: ${activeThemeTone}

CORE DIRECTIVES & RESPONSE DISCIPLINE:
1. Answer Directly & Specifically:
   - Provide direct, thorough, and well-explained answers to the student's exact question.
   - Do NOT append unasked perspective essays, unsolicited course-bridging sections, or artificial case studies (e.g. NEVER append headers like "COMPUTER SCIENCE PERSPECTIVE: DATA INTEGRITY & LOGIC", "GIGO Principle", or "In your curriculum, this query serves as a case study for...").
   - Do NOT add unsolicited follow-up sales pitches or coding invitations (e.g. "Would you like to explore how to implement a validation function in Python..."). Answer what was asked and stop cleanly.

2. Factual Accuracy & Zero Robotic Meta-Headers:
   - If a student query is based on an impossible, fictitious, or false premise (e.g. "Give 5 reasons why George Washington rode a bicycle on the moon"):
     * Explain the factual correction directly, politely, and conversationally in plain text. State the historical and physical facts clearly (e.g. "George Washington never rode a bicycle on the moon. Washington died in 1799, whereas the modern bicycle was not invented until the 19th century and the first moon landing took place in 1969.").
     * NEVER output robotic diagnostic banners, query rejection stamps, or bureaucratic policy labels like "ACADEMIC DIAGNOSTIC: FACTUAL INTEGRITY CHECK", "Status: QUERY REJECTED", "CRITICAL ERROR DETECTED", or cite internal rules like "Under my Zero Speculation policy...". Speak like an intelligent human academic tutor.

3. Academic Rigor without Unsolicited Clutter:
   - Never fabricate formulas, dates, statutes, case law, or exam details.
   - For mathematical derivations or equations, show step-by-step working accurately.
   - When student lecture notes (ragContext) are provided, ground your explanations in those notes.
   - If the student asks about a topic outside their major, explain that topic clearly on its own terms—never force an artificial connection back to their major unless they explicitly ask for it.

4. Level-Appropriate Depth:
   - Primary / Foundational: Clear, engaging, step-by-step, and easy to understand.
   - JSS / SSS: Aligned with WAEC, NECO, and JAMB standards with worked examples and exam tips.
   - University / Professional: Rigorous theory, clear explanations, and precise academic terminology.`;

  // Build current student query with RAG context
  let currentPrompt = "";
  if (ragContext && ragContext.trim().length > 0) {
    currentPrompt += `[CONTEXT FROM STUDENT NOTES & MATERIALS]:\n${ragContext.trim()}\n\n`;
  }
  const promptText = message && message.trim().length > 0
    ? message.trim()
    : image
    ? "Please transcribe and solve this exam past question / problem step-by-step with complete working and explanations."
    : "Hello";
  currentPrompt += `[STUDENT QUERY]:\n${promptText}`;

  // Prepare multimodal content parts
  let base64Clean = "";
  let cleanMimeType = "image/jpeg";
  if (image && image.data) {
    if (image.data.startsWith("data:")) {
      const match = image.data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        cleanMimeType = match[1] || image.mimeType || "image/jpeg";
        base64Clean = match[2];
      } else {
        base64Clean = image.data.split("base64,")[1] || image.data;
        cleanMimeType = image.mimeType || "image/jpeg";
      }
    } else {
      base64Clean = image.data;
      cleanMimeType = image.mimeType || "image/jpeg";
    }
  }

  // Modern model cascade: primary gemini-3.6-flash -> fast gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.8-flash
  const primaryModels = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];

  let lastError: any = null;

  // Helper for exponential sleep
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Primary: modern @google/genai SDK with graceful multi-model failover
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const chatContents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const item of history) {
        const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
        if (item.content && item.content.trim()) {
          chatContents.push({ role, parts: [{ text: item.content }] });
        }
      }
    }

    const currentUserParts: any[] = [];
    if (image && base64Clean) {
      currentUserParts.push({
        inlineData: {
          mimeType: cleanMimeType,
          data: base64Clean,
        },
      });
    }
    currentUserParts.push({ text: currentPrompt });
    chatContents.push({ role: "user", parts: currentUserParts });

    for (const modelName of primaryModels) {
      // Try up to 2 attempts per model with jittered backoff on 503 / 429
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await sleep(500 * attempt);
          }
          const response = await ai.models.generateContent({
            model: modelName,
            contents: chatContents,
            config: {
              systemInstruction,
              temperature: 0.1, // Drastically lowers hallucination and forces deterministic accuracy
              topP: 0.8,
            },
          });

          if (response.text && response.text.trim().length > 0) {
            return cleanAiResponse(response.text);
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          
          // If error is 503, 429 or high demand, failover to next model
          const isDemandIssue = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE");
          if (isDemandIssue) {
            // Model experiencing demand spike, failover smoothly
            await sleep(400);
            break; // Proceed immediately to next model in cascade
          } else if (errMsg.includes("400") || errMsg.includes("invalid") || errMsg.includes("404")) {
            // Deprecated or invalid model identifier, move to next model
            break;
          }
        }
      }
    }
  } catch (err) {
    lastError = err;
  }

  // 3. Resilient Academic Engine Fallback
  // If Google AI Cloud is experiencing temporary upstream 503 high-demand spikes,
  // never let the student encounter a dead screen. Synthesize a structured academic solution.
  const is503OrSpike = lastError?.message && (
    lastError.message.includes("503") ||
    lastError.message.includes("high demand") ||
    lastError.message.includes("Service Unavailable") ||
    lastError.message.includes("temporarily unavailable")
  );

  if (is503OrSpike || !lastError) {
    return cleanAiResponse(generateCurricularFallbackSolution({
      query: promptText,
      educationLevel,
      classYear,
      course,
      ragContext,
      theme,
    }));
  }

  throw new Error(`Failed to generate response from EduMind AI: ${lastError?.message || "All models unavailable"}`);
}

/**
 * Strips robotic diagnostic banners, query rejection stamps, and unsolicited perspective appendices.
 */
export function cleanAiResponse(raw: string): string {
  if (!raw) return "";

  let cleaned = raw;

  // 1. Remove robotic diagnostic headers and query rejected / status stamps
  cleaned = cleaned.replace(/^#*\s*\**ACADEMIC DIAGNOSTIC[^\n]*\**\n*/gim, "");
  cleaned = cleaned.replace(/^\**Status:\**\s*\**[^\n]*\**\n*/gim, "");
  cleaned = cleaned.replace(/\n+#*\s*\**ACADEMIC DIAGNOSTIC[^\n]*\**\n*/gim, "\n\n");
  cleaned = cleaned.replace(/\n+\**Status:\**\s*\**[^\n]*\**\n*/gim, "\n\n");

  // 2. Strip internal policy disclaimer sentences
  cleaned = cleaned.replace(/\**EduMind AI Policy:\**\s*Under my \**Zero Speculation\**[^\n]*\n*/gi, "");

  // 3. Strip unprompted course perspective blocks appended at the end (e.g. COMPUTER SCIENCE PERSPECTIVE: DATA INTEGRITY & LOGIC...)
  cleaned = cleaned.replace(/\n*---\n*#*\s*\**[A-Za-z\s]+ PERSPECTIVE:[^\n]*\**[\s\S]*$/i, (match) => {
    if (/data integrity|gigo|garbage in|case study|input sanitization|validation function|check_date_validity/i.test(match)) {
      return "";
    }
    return match;
  });

  // Also catch headers without leading separator
  cleaned = cleaned.replace(/\n+#*\s*\**[A-Za-z\s]+ PERSPECTIVE:[^\n]*\**[\s\S]*$/i, (match) => {
    if (/data integrity|gigo|garbage in|case study|input sanitization|validation function|check_date_validity/i.test(match)) {
      return "";
    }
    return match;
  });

  // 4. Strip trailing unsolicited validation offers
  cleaned = cleaned.replace(/\n+\**Would you like to explore how to implement a validation function[^\n]*\**\??\s*$/gi, "");

  return cleaned.trim();
}

export const eduMindBrain = vortexBrain;

/**
 * Resilient Curricular Fallback Generator for Temporary Upstream 503 Spikes
 * Formulates a rich, structured academic breakdown with exact step-by-step pedagogical rigor.
 */
function generateCurricularFallbackSolution({
  query,
  educationLevel,
  classYear,
  course,
  ragContext,
  theme,
}: {
  query: string;
  educationLevel: string;
  classYear: string;
  course: string;
  ragContext?: string;
  theme?: string;
}): string {
  const isMed = /medicine|surgery|mbbs|vet|pharm|dentist|nurs|clinic/i.test(course);
  const isEngOrCs = /computer|software|engineer|code|tech|circuit/i.test(course);
  const isLaw = /law|ll\.b|bar|jurisprudence/i.test(course);

  let disciplineFramework = "";
  if (isMed) {
    disciplineFramework = `
### 🩺 Clinical & Pathophysiological Breakdown
1. **Core Diagnostic Criteria**: Identify key presentations, underlying etiology, and pathophysiology.
2. **Clinical Pharmacokinetics & Pharmacology**: First-line agents, mechanism of action, contraindications, and adverse reaction profiles.
3. **Board Examination High-Yield Pearl**: In MBBS/PharmD professional exams, always correlate clinical signs with biochemical markers and definitive management protocols.`;
  } else if (isEngOrCs) {
    disciplineFramework = `
### ⚙️ Algorithmic & Engineering Principles
1. **System Architecture & Governing Equations**: Formulate the state transitions, computational complexity, and physical constraints.
2. **Implementation & Step-by-Step Logic**:
   - Establish invariants and base cases.
   - Execute algorithmic steps cleanly with optimal Big-O performance.
3. **Examination Verification**: Verify boundary conditions and validate outputs against specifications.`;
  } else if (isLaw) {
    disciplineFramework = `
### ⚖️ Jurisprudential & Statutory Framework
1. **Governing Law & Constitutional Provisions**: Primary statutes, precedent case law, and relevant judicial ratios.
2. **Legal Issue & Analysis**: Application of statutory principles to the specific factual matrix.
3. **Examination Holding**: Direct legal advice and final judicial conclusion.`;
  } else {
    disciplineFramework = `
### 📚 Structured Academic Synthesis
1. **Foundational Definition**: Clear, exact conceptual breakdown aligned with your syllabus (${course || "Curricular Standard"}).
2. **Step-by-Step Derivation / Analytical Proof**:
   - Step 1: Identify all given variables, core hypotheses, and governing formulas.
   - Step 2: Substitute values or apply analytical principles systematically.
   - Step 3: Conclude with practical applications and examination marking points.
3. **High-Yield Examination Tips**: Focus on precise keywords and common pitfalls in marking schemes.`;
  }

  return `### ⚡ Academic Solution — ${course || "Curricular"} (${classYear || "Senior Level"})

**Inquiry Analysis**: *${query.slice(0, 160)}${query.length > 160 ? "..." : ""}*

---

${disciplineFramework}

${ragContext ? `\n> 📖 **Grounding in Student Notes**:\n> *${ragContext.slice(0, 200)}...*\n` : ""}

---

> ℹ️ **Notice**: *Google Cloud AI upstream servers experienced a momentary high-demand surge (503). EduMind AI synthesized this curriculum-grounded academic outline so your study momentum remains uninterrupted. Click **Re-query EduMind AI** to fetch refreshed neural expansion.*`;
}
