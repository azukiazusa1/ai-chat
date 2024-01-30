import { useRef, useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message === "") return;
    setIsGenerating(true);
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setMessage("");

    abortControllerRef.current = new AbortController();

    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      signal: abortControllerRef.current.signal,
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read().catch((e) => {
        console.log(e);
        return { done: true, value: undefined };
      });
      if (done) {
        setIsGenerating(false);
        return;
      }
      if (!value) continue;
      const lines = decoder.decode(value);
      const chunks = lines
        .split("data: ") // 各行は data: というキーワードで始まる
        .map((line) => line.trim())
        .filter((s) => s); // 余計な空行を取り除く
      for (const chunk of chunks) {
        setMessages((messages) => {
          const content = messages[messages.length - 1].content;
          return [
            ...messages.slice(0, -1),
            { role: "assistant", content: content + chunk },
          ];
        });
      }
    }
  };

  const handleClickCancel = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  return (
    <div id="chat-container">
      <div className="messages-container">
        {messages.map((message, i) => {
          if (message.role === "user") {
            return (
              <div key={i} className="chat-message user-message">
                {message.content}
              </div>
            );
          }
          return (
            <div key={i} className="chat-message ai-message">
              {message.content}
            </div>
          );
        })}
      </div>
      <form id="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button className="button" disabled={isGenerating} type="submit">
          {isGenerating ? "Generating..." : "Send"}
        </button>
        {isGenerating && (
          <button className="button" onClick={handleClickCancel}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default App;
