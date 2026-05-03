import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const SiteTextsContext = createContext({});

export const SiteTextsProvider = ({ children }) => {
  const [texts, setTexts] = useState({});

  useEffect(() => {
    api.get("/site-texts?lang=pt")
      .then(({ data }) => setTexts(data || {}))
      .catch(() => {});
  }, []);

  return (
    <SiteTextsContext.Provider value={texts}>
      {children}
    </SiteTextsContext.Provider>
  );
};

// t("section", "key", "fallback") — reads from the loaded DB texts
export const useTexts = () => {
  const texts = useContext(SiteTextsContext);
  return (section, key, fallback = "") => texts?.[section]?.[key] || fallback;
};
