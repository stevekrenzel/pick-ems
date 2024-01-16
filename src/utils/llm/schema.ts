import type { JSONSchema } from "json-schema-to-ts";

// NOTE: We don't use `json-schema-to-ts`'s FromSchema here because
// it can't handle non-static schemas. If you try to
// use generics it will recursively try to resolve the
// types until the compiler times out.
export const SCHEMA = (toolSchema: JSONSchema) =>
  ({
    type: "object",
    description:
      "Your response to the user. Think step-by-step about the decisions you are about to make. Be careful and thorough. *ALWAYS GENERATE THE `analysis` BEFORE THE `conclusion`.*",
    properties: {
      analysis: {
        type: "string",
        description:
          "Your careful and thorough analysis, thinking step-by-step about each decision you are about to make in your conclusion. *ALWAYS GENERATE THIS FIRST*.",
      },
      conclusion: toolSchema,
    },
    required: ["analysis", "conclusion"],
  } as const satisfies JSONSchema);
