import OpenAI from "openai";
import { config } from "dotenv";
import { JSONSchema } from "json-schema-to-ts";
import { SCHEMA } from "./schema";

config();

const API_KEY = process.env.OPENAI_API_KEY;
const VERBOSE = process.env.VERBOSE === "true";

const openai = new OpenAI({
  apiKey: API_KEY,
});

/**
 * Wraps calls to the LLM that will call a well-typed tool and return
 * a well-typed response.
 *
 */
export async function llm<T>(
  systemPrompt: string,
  userPrompt: any,
  toolSchema: { schema: JSONSchema; type: T }
): Promise<T> {
  // TODO: There is a lot going on this function. We should
  // break it up / clean it up.

  if (VERBOSE) {
    console.log("=============================================");
    console.log("Starting request to LLM:");
    console.log("\nSYSTEM:\n", systemPrompt);
    console.log("\nUSER:\n", JSON.stringify(userPrompt));
  }

  // We wrap the provided schema in a parent schema that forces
  // the LLM to think and perform analysis before generating tool
  // parameters. If we won't do this, and you ask the LLM to, for
  // example, generate a boolean – it will just generate a boolean
  // without putting a lot of thought into that boolean. Even if
  // your prompt uses Chain-of-Thought or similar techniques.
  //
  // By forcing the first tool parameter the LLM generates to be
  // that analysis, we can ensure that the LLM will not just jump
  // right into generating the tool parameters, but will also
  // "think" about it first.
  const schema = SCHEMA(toolSchema.schema) as any;

  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(userPrompt),
      },
    ],
    model: "gpt-4-1106-preview",
    temperature: 0.1,
    max_tokens: 4000,
    tool_choice: { type: "function", function: { name: "response" } },
    tools: [
      {
        type: "function",
        function: {
          name: "response",
          description: "The JSON response to the user's inquiry.",
          parameters: schema,
        },
      },
    ],
  });

  // TODO: Do better validation on the response.
  const content =
    response.choices[0]?.message?.tool_calls![0]?.function.arguments;

  if (content == null) {
    throw new Error("LLM did not return arguments to parse");
  }

  if (VERBOSE) {
    console.log("\nRESPONSE:\n");
    console.log(JSON.stringify(JSON.parse(content), null, 2));
    console.log("=============================================");
  }

  return JSON.parse(content).conclusion as T;
}
