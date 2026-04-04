import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface LandingNavProps {
  onGetStarted?: () => void;
}

export function LandingNav({ onGetStarted }: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-lg border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 max-w-6xl mx-auto px-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          ChillInsure
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Council</a>
          <a href="#protection" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Coverage</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Button size="sm" onClick={onGetStarted}>Get covered</Button>
        </div>

        <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border px-6 pb-4 space-y-3">
          <a href="#how-it-works" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>How it works</a>
          <a href="#features" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>AI Council</a>
          <a href="#protection" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Coverage</a>
          <Button className="w-full" size="sm" onClick={() => {setOpen(false); onGetStarted?.();}}>Get covered</Button>
        </div>
      )}
    </nav>
  );
}
