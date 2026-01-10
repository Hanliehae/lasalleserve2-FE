import { useState } from "react";
import { useAuth } from "../context/auth-context.jsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AlertCircle, Upload } from "lucide-react";

export function RegisterPage({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mahasiswa",
    department: "",
    studentId: "",
    phone: "",
  });
  const [ktmFile, setKtmFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi
    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (formData.role === "mahasiswa" && !ktmFile) {
      setError("Mahasiswa wajib upload KTM");
      return;
    }

    if (formData.role === "mahasiswa" && !formData.studentId) {
      setError("Mahasiswa wajib mengisi NIM");
      return;
    }

    setLoading(true);
    try {
      const ktmUrl = ktmFile
        ? URL.createObjectURL(ktmFile) // Simulasi upload
        : undefined;

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ktmUrl,
        department: formData.department,
        studentId: formData.studentId,
        phone: formData.phone,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setKtmFile(file);
    } else {
      setError("Harap upload file gambar (JPG, PNG)");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle>Daftar Akun BUF UKDLSM</CardTitle>
          <CardDescription>
            Buat akun baru untuk mengakses sistem peminjaman BUF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Peran</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                    <SelectItem value="dosen">Dosen</SelectItem>
                    <SelectItem value="staf">Staf Universitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departemen/Biro/Prodi</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Contoh: Teknik Informatika"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>

            {formData.role === "mahasiswa" && (
              <div className="space-y-2">
                <Label htmlFor="studentId">NIM</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Nomor Induk Mahasiswa"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            {formData.role === "mahasiswa" && (
              <div className="space-y-2">
                <Label htmlFor="ktm">Unggah KTM (Kartu Tanda Mahasiswa)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ktm"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {ktmFile && (
                    <span className="text-sm text-green-600">
                      ✓ {ktmFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: JPG, PNG (Maks. 2MB)
                </p>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={onNavigateToLogin}
              >
                Kembali ke Masuk
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Daftar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
