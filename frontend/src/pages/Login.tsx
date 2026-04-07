import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import animateSvg from "@/assets/animate.svg";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        const errorText = await response.text();
        setError(errorText || "Falha no login. Verifique suas credenciais.");
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left — Illustration */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center gap-8 px-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-center leading-tight text-primary">
          Acesse sua conta<br />para aproveitar nossas ferramentas
        </h1>
        <img src={animateSvg} alt="Astronauta" className="w-72 h-72 lg:w-96 lg:h-96" />
      </div>

      {/* Right — Login card */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="card-glass w-full max-w-md flex flex-col items-center gap-6 p-8 rounded-2xl"
        >
          <h1 className="text-3xl font-extrabold text-primary">Login</h1>

          <div className="w-full space-y-2">
            <Label htmlFor="username" className="text-foreground/90">
              Usuário
            </Label>
            <Input
              id="username"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-card border-border/40 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="password" className="text-foreground/90">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border/40 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-base font-extrabold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_40px_-12px_hsl(var(--primary)/0.35)]"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          {error && (
            <p className="text-sm font-medium text-destructive text-center">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
