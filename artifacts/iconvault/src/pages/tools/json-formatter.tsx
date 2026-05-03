import { useState } from "react";
import { Link } from "wouter";
import { Code2, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JsonFormatter() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formatJSON = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  const minifyJSON = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    toast({
      title: "COPIED",
      description: "JSON copied to clipboard.",
      className: "border-[3px] border-foreground rounded-none bg-[#00E676] text-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  return (
    <div className="py-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-6 shrink-0">
        <Link href="/tools" className="font-bold hover:underline decoration-4 mb-6 inline-block">← BACK TO TOOLS</Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-card border-[3px] border-foreground flex items-center justify-center shadow-[2px_2px_0_#0A0A0A]">
            <Code2 className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase">JSON Formatter</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 nb-card p-4 md:p-6 bg-card">
        <div className="flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex gap-4">
            <button onClick={formatJSON} className="nb-btn bg-primary px-6">FORMAT</button>
            <button onClick={minifyJSON} className="nb-btn bg-secondary px-6">MINIFY</button>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setInput(""); setError(null); }} className="nb-btn bg-destructive text-white px-4">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={handleCopy} className="nb-btn bg-[#00E676] px-4 flex items-center gap-2">
              <Copy className="w-5 h-5" /> COPY
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF6B35] text-white p-4 border-[3px] border-foreground font-mono font-bold text-sm shrink-0">
            ERROR: {error}
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder='{"paste": "your JSON here"}'
          className={`flex-1 w-full nb-input font-mono text-sm resize-none ${error ? 'border-[#FF6B35]' : ''}`}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
