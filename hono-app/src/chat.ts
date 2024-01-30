import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// コマンドライン引数からメッセージを取得
const message = process.argv[2];

const main = async () => {
  const chatStream = openai.beta.chat.completions.stream({
    messages: [{ role: "user", content: message }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatStream) {
    console.log(message.choices[0].delta.content);
  }

  const chatCompletion = await chatStream.finalChatCompletion();
  console.log(chatCompletion.choices[0].message);
};

main();
