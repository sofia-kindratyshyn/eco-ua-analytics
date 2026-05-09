import { Link, useLocation } from "react-router";
import { Menu, Moon, Sun, Wind } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { t, i18n } = useTranslation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/",          label: t("header.nav.home") },
    { path: "/map",       label: t("header.nav.map") },
    { path: "/analytics", label: t("header.nav.analytics") },
    { path: "/alerts",    label: t("header.nav.alerts") },
  ];

  const switchLang = (lang: string) => i18n.changeLanguage(lang);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Wind className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-none" style={{ fontWeight: 600 }}>
                AirQuality
              </span>
              <span className="text-xs text-muted-foreground">
                {t("header.tagline")}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? "page" : undefined}
                className={`text-sm transition-colors hover:text-primary ${
                  isActive(item.path) ? "text-primary" : "text-foreground"
                }`}
                style={{ fontWeight: isActive(item.path) ? 600 : 500 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center rounded-md border border-border overflow-hidden text-xs" style={{ fontWeight: 600 }}>
              <button
                onClick={() => switchLang("en")}
                className={`px-2.5 py-1.5 transition-colors ${
                  i18n.language.startsWith("en")
                    ? "bg-primary text-white"
                    : "hover:bg-muted text-foreground"
                }`}
                aria-label="Switch to English"
                aria-pressed={i18n.language.startsWith("en")}
              >
                EN
              </button>
              <button
                onClick={() => switchLang("uk")}
                className={`px-2.5 py-1.5 transition-colors ${
                  i18n.language.startsWith("uk")
                    ? "bg-primary text-white"
                    : "hover:bg-muted text-foreground"
                }`}
                aria-label="Switch to Ukrainian"
                aria-pressed={i18n.language.startsWith("uk")}
              >
                UA
              </button>
            </div>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
              aria-label={t("header.toggle_theme")}
              onClick={toggle}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("header.menu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="flex flex-col gap-2 py-4 md:hidden border-t" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? "page" : undefined}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
