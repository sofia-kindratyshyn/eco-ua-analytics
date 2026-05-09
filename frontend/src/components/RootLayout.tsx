import { Outlet } from "react-router";
import { Header } from "./Header";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main aria-label="Main content">
        <Outlet />
      </main>
    </div>
  );
}
