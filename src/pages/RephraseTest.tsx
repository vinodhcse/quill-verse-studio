import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/";

const RephraseTest: React.FC = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const handleRephrase = async () => {
    setOutput("");
    setStreaming(true);
    // Listen for streaming tokens
    const unlisten = await window.__TAURI__.event.listen("llm-stream", (event: any) => {
      setOutput((prev) => prev + event.payload.token);
    });
    try {
      await invoke("expand_text_stream", { prompt: input });
    } catch (e) {
      setOutput("Error: " + e);
    } finally {
      setStreaming(false);
      setTimeout(() => unlisten(), 1000);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Test LLM Rephrase/Expand</h2>
      <textarea
        rows={4}
        style={{ width: "100%", marginBottom: 12 }}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter text to rephrase or expand..."
      />
      <button onClick={handleRephrase} disabled={streaming || !input} style={{ marginBottom: 12 }}>
        {streaming ? "Rephrasing..." : "Rephrase/Expand"}
      </button>
      <div style={{ minHeight: 40, background: "#f9f9f9", padding: 8, borderRadius: 4 }}>
        <strong>Output:</strong>
        <div>{output}</div>
      </div>
    </div>
  );
};

export default RephraseTest;
