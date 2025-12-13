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
import { AlertCircle } from "lucide-react";
import logoDelasalle from "../assets/images/logo-delasalle.png";

export function LoginPage({ onNavigateToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 items-center">
          <CardTitle >Login</CardTitle>
           <CardTitle>LasalleServe</CardTitle>
          <div className="flex justify-center mb-4">
            <img
              src={logoDelasalle}
              alt="Logo De La Salle"
              style={{ width: "100px", height: "auto" }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>

            <div className="text-center">
              <p className="text-muted-foreground">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="text-primary hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            </div>
          </form>

          <div className="mt-6 space-y-2 rounded-lg bg-muted p-4">
            <p className="text-muted-foreground">Demo Akun:</p>
            <p>Admin: admin@buf.ac.id / admin123</p>
            <p>Staf: staf@buf.ac.id / staf123</p>
            <p>Mahasiswa: mahasiswa@student.ac.id / mhs123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
