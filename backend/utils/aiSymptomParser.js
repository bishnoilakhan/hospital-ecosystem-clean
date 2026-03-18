const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEBUG_CACHE = process.env.NODE_ENV === "development";
const MAX_CACHE_SIZE = 100;
const cache = new Map();

const extractSymptomsAI = async (text) => {
  if (!text || typeof text !== "string") return null;
  const cacheKey = text.trim().toLowerCase();
  if (cache.has(cacheKey)) {
    const value = cache.get(cacheKey);
    cache.delete(cacheKey);
    cache.set(cacheKey, value);
    if (DEBUG_CACHE) {
      console.log("[AI CACHE HIT]", cacheKey);
    }
    return value;
  }

  try {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("AI timeout")), 3000);
    });

    const response = await Promise.race([
      client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Extract medical symptoms from user input.

RULES:

* Return ONLY a JSON array
* No explanation
* No extra text
* Max 6 symptoms
* Each symptom = short (1-2 words)
* Capitalized

Example:
["Fever", "Headache"]
`
          },
          { role: "user", content: text }
        ],
        temperature: 0.2,
        max_tokens: 100
      }),
      timeoutPromise
    ]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    const result = response.choices?.[0]?.message?.content;
    if (!result) return null;
    const cleaned = result.trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        if (DEBUG_CACHE) {
          console.log("[AI CACHE EVICT]", firstKey);
        }
      }
      cache.set(cacheKey, parsed);
      if (DEBUG_CACHE) {
        console.log("[AI CACHE SET]", cacheKey, "| size:", cache.size);
      }
      return parsed;
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.error("JSON parse failed:", cleaned);
      }
      return null;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("OpenAI failed:", error.message);
    }
    return null;
  }
};

module.exports = { extractSymptomsAI };
