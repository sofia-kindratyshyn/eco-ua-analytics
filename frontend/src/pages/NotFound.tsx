import { Link } from "react-router";
import { Wind } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Wind className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl mb-4" style={{ fontWeight: 700 }}>
          {t("not_found.title")}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t("not_found.description")}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", fontWeight: 500 }}
        >
          {t("not_found.return")}
        </Link>
      </div>
    </div>
  );
}
