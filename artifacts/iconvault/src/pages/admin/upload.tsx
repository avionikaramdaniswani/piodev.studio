import { useLocation } from "wouter";
import { Upload } from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UploadIconForm } from "@/components/shared/UploadIconForm";

function AdminUpload() {
  const [, navigate] = useLocation();

  return (
    <AdminLayout title="UPLOAD IKON">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[4px] border-foreground pb-4">
          <Upload className="w-7 h-7" />
          <div>
            <h1 className="font-black text-2xl">UPLOAD IKON</h1>
            <p className="font-mono text-xs opacity-50">Tambah ikon baru ke koleksi IconVault</p>
          </div>
        </div>

        <UploadIconForm onSuccess={(slug) => navigate(`/admin/icons`)} />
      </div>
    </AdminLayout>
  );
}

export default function AdminUploadPage() {
  return (
    <RoleGuard requiredRole="staff">
      <AdminUpload />
    </RoleGuard>
  );
}
