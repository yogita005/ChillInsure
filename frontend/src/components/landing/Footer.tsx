import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const links = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "AI Council", href: "#features" },
    { label: "Coverage", href: "#protection" },
    { label: "Dashboard", href: "/dashboard", isRoute: true },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Licensing", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border bg-background">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-display font-bold text-foreground mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              ChillInsure
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Parametric insurance for India's gig economy. Automatic, fair, instant.
            </p>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="font-display font-semibold text-sm mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {items.map((link) => (
                  <li key={link.label}>
                    {"isRoute" in link && link.isRoute ? (
                      <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 ChillInsure. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for India's delivery heroes
          </p>
        </div>
      </div>
    </footer>
  );
}
