import { Outlet } from "react-router-dom";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { catalogService } from "../../services/catalogService.js";
import { Footer } from "./Footer.jsx";
import { Header } from "./Header.jsx";
import { TopBar } from "./TopBar.jsx";

export const MainLayout = () => {
  const { data } = useAsyncData(() => catalogService.getCategories(), []);

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <TopBar />
      <Header categories={data || []} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
