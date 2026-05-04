import { useLocation } from "wouter";
import { UploadIconForm } from "@/components/shared/UploadIconForm";

export default function UploadIcon() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <span className="nb-badge" style={{ background: "#00E676" }}>Contribute</span>
        <h1 className="text-5xl font-black mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#0A0A0A" }}>
          UPLOAD ICON
        </h1>
        <p className="text-lg mt-2" style={{ color: "#3D3D3D" }}>Share your SVG with the community. MIT license preferred.</p>
      </div>

      <UploadIconForm onSuccess={(slug) => setLocation(`/icons/${slug}`)} />
    </div>
  );
}
