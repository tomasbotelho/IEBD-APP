import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const SearchBar = ({ large = false, defaultValue = "" }) => {
  const [query, setQuery] = useState(defaultValue);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const onSubmit = (event) => {
    event.preventDefault();
    navigate(`/pesquisa?q=${encodeURIComponent(query)}`);
  };

  return (
    <form className="group relative" onSubmit={onSubmit}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-black" />
      <input
        className={`w-full border border-zinc-300 bg-white text-ink-900 outline-none transition placeholder:text-zinc-400 focus:border-black focus:ring-2 focus:ring-zinc-200 ${
          large
            ? "h-14 rounded-[1.35rem] pl-12 pr-20 text-base"
            : "h-12 rounded-xl pl-11 pr-4 text-sm"
        }`}
        placeholder="Pesquisar por modalidade, produto ou marca"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {large ? (
        <button
          className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-md bg-black px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800"
          type="submit"
        >
          Pesquisar
        </button>
      ) : null}
    </form>
  );
};
