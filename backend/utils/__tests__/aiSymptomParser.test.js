let mockCreate;

jest.mock("openai", () => {
  return function OpenAI() {
    this.chat = {
      completions: {
        create: (...args) => mockCreate(...args)
      }
    };
  };
});

const { extractSymptomsAI } = require("../aiSymptomParser");

jest.setTimeout(10000);

describe("AI Symptom Parser", () => {
  beforeEach(() => {
    mockCreate = jest.fn();
  });

  test("extracts common symptoms", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '["Fever","Headache"]' } }]
    });

    const result = await extractSymptomsAI("I have fever and headache");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("handles empty input", async () => {
    const result = await extractSymptomsAI("");
    expect(result === null || result.length === 0).toBe(true);
  });

  test("returns null or fallback-safe output on invalid input", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }]
    });

    const result = await extractSymptomsAI("asdfghjkl");
    expect(result === null || Array.isArray(result)).toBe(true);
  });
});
