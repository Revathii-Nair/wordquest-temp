import { ChevronRight, LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";

export const routes = [
  { to: "/play", label: "Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/analytics", label: "Analytics" },
];

export default function Header({ user, menuOpen, setMenuOpen, dark, setDark }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut({ global: true });
      setMenuOpen(false);
      window.location.href = "/signin";
    } catch (error) {
      console.error("Unable to sign out:", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-border bg-background backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl border border-brand-border bg-brand-card p-2 text-brand-accent"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-left">
              <span>
                <span className="block text-base font-black">WORDQUEST</span>

                <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-brand-muted">{user?.username || "Player"}</span>
              </span>
            </button>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl border border-brand-border bg-brand-card p-2 text-brand-muted"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-background/80" onClick={() => setMenuOpen(false)} />

          <div className="fixed left-4 top-[76px] z-50 w-[280px] rounded-2xl border border-brand-border bg-brand-card p-3 shadow-2xl">
            <nav className="space-y-1">
              {routes.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                      isActive ? "bg-brand-accent/10 text-brand-accent" : "text-brand-muted hover:bg-background hover:text-foreground"
                    }`
                  }
                >
                  {label}

                  <ChevronRight size={15} className="ml-auto opacity-50" />
                </NavLink>
              ))}

              <div className="my-2 border-t border-brand-border" />

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-brand-pink hover:bg-brand-pink/10"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
