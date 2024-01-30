import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import OpenAI from "openai";

import { cors } from "hono/cors";
const app = new Hono();

app.use("*", cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Message = {
  role: "user" | "system";
  content: string;
};

app.post("/chat", async (c) => {
  const body = await c.req.json<{
    message: string;
    mesaages: Message[];
  }>();
  return streamText(c, async (stream) => {
    const chatStream = openai.beta.chat.completions.stream({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: body.message }],
      stream: true,
    });

    stream.onAbort(() => {
      chatStream.abort();
    });

    chatStream.on("abort", () => {
      console.log("abort");
    });

    for await (const message of chatStream) {
      await stream.write(message.choices[0].delta.content || "");
    }

    stream.close();
  });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
