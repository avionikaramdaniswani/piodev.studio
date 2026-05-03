import { useState } from "react";
import { Link } from "wouter";
import { Binary, ArrowRightLeft, Copy, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Base64Tool() {
  const { toast } = useToast();
  const [textMode, setTextMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const processText = (val: string, mode: "encode" | "decode") => {
    setInput(val);
    setError(null);
    
    if (!val) {
      setOutput("");
      return;
    }

    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(val))));
      } else {
        setOutput(decodeURIComponent(escape(atob(val))));
      }
    } catch (e) {
      setError("Invalid input for " + mode);
      setOutput("");
    }
  };

  const handleModeSwitch = () => {
    const newMode = textMode === "encode" ? "decode" : "encode";
    setTextMode(newMode);
    
    // Swap input/output if output is valid
    if (output && !error) {
      setInput(output);
      processText(output, newMode);
    } else {
      processText(input, newMode);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({
      title: "COPIED",
      description: "Output copied to clipboard.",
      className: "border-[3px] border-foreground rounded-none bg-primary text-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Strip the data:image/png;base64, part if we only want the raw base64
      // Or keep it for CSS background usage. We'll keep it as it's useful.
      setInput(file.name + " (File loaded)");
      setOutput(result);
      setTextMode("encode");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/tools" className="font-bold hover:underline decoration-4 mb-6 inline-block">← BACK TO TOOLS</Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-foreground text-background border-[3px] border-foreground flex items-center justify-center shadow-[2px_2px_0_#FFE034]">
            <Binary className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase">Base64 Tool</h1>
        </div>
        <p className="font-mono text-lg">Encode/decode strings or convert files to Base64 data URIs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Left Panel - Input */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-black uppercase">{textMode === "encode" ? "TEXT" : "BASE64"} INPUT</h2>
            <label className="nb-btn bg-secondary px-3 py-1 text-xs cursor-pointer flex items-center gap-2">
              <Upload className="w-3 h-3" /> FILE TO BASE64
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => processText(e.target.value, textMode)}
            placeholder={textMode === "encode" ? "Type something to encode..." : "Paste Base64 here..."}
            className={`nb-input min-h-[300px] font-mono text-sm resize-y ${error ? 'border-[#FF6B35]' : ''}`}
          />
          {error && <span className="font-bold text-[#FF6B35] text-sm mt-1">{error}</span>}
        </div>

        {/* Center - Switch */}
        <div className="flex justify-center md:flex-col gap-4 py-4 md:py-0">
          <button 
            onClick={handleModeSwitch}
            className="nb-btn bg-accent rounded-full p-4"
            title="Swap encode/decode"
          >
            <ArrowRightLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-black uppercase">{textMode === "encode" ? "BASE64" : "TEXT"} OUTPUT</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => { setInput(""); setOutput(""); setError(null); }}
                className="nb-btn bg-card px-2 py-1"
                title="Clear"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleCopy}
                disabled={!output}
                className="nb-btn bg-primary px-3 py-1 text-xs flex items-center gap-2 disabled:opacity-50"
              >
                <Copy className="w-3 h-3" /> COPY
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="nb-input min-h-[300px] font-mono text-sm resize-y bg-secondary/50 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
