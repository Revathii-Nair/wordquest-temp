import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, LogIn } from "lucide-react";
import { signIn } from "aws-amplify/auth";

const SIGN_UP_URL =
  "https://ap-south-1xunnsjsub.auth.ap-south-1.amazoncognito.com/signup?client_id=388ic5mifocpkc420jtp51e55a&redirect_uri=https%3A%2F%2Fwordquest-tau.vercel.app&response_type=code&scope=email+openid+phone";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      await signIn({ username, password });
      window.location.href = "/";
    } catch (error) {
      setError(error.message || "Unable to sign in.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-brand-border bg-brand-card p-7 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-brand-accent">Wordfall</h1>

            <p className="mt-2 text-sm text-brand-muted">Sign in to continue playing.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold">Username or Email</label>

              <div className="flex items-center rounded-xl border border-brand-border bg-background ">
                <Mail size={18} className="ml-3 text-brand-muted" />

                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username or email"
                  required
                  className="w-full bg-transparent py-3 pl-3 pr-4 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Password</label>

              <div className="flex items-center rounded-xl border border-brand-border bg-background ">
                <LockKeyhole size={18} className="ml-3 text-brand-muted" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-transparent py-3 pl-3 pr-2 text-sm outline-none"
                />

                <button type="button" onClick={() => setShowPassword((value) => !value)} className="mr-3 text-brand-muted hover:text-brand-accent">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-brand-pink bg-brand-pink/10 px-4 py-3 text-sm font-medium text-brand-pink">{error}</div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 text-sm font-black text-background hover:cursor-pointer"
            >
              <LogIn size={18} />
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-muted">
            Don't have an account?
            <a href={SIGN_UP_URL} className="ml-1 font-bold text-brand-accent hover:underline">
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
