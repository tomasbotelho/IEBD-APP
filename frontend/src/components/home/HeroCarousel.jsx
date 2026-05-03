import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "../../utils/format.js";

const AUTO_INTERVAL = 5000;

export const HeroCarousel = ({ highlights = [] }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const count = highlights.length;

  const go = useCallback(
    (index) => {
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, count, next]);

  if (!count) return null;

  const slide = highlights[current];

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative h-[420px] md:h-[520px]">
        {highlights.map((h, i) => (
          <div
            key={h.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {h.image && (
              <img
                src={h.image}
                alt={h.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-xl">
                {h.highlightTitle && (
                  <h2 className="font-display text-4xl uppercase leading-none text-white md:text-6xl">
                    {h.highlightTitle}
                  </h2>
                )}
                {h.highlightSubtitle && (
                  <p className="mt-3 text-base text-white/80 md:text-lg">{h.highlightSubtitle}</p>
                )}
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-3xl font-bold text-white">{formatPrice(h.price)}</span>
                </div>
                <Link
                  to={`/produto/${h.slug || h.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="mt-5 inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                >
                  Ver produto
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next controls */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Pagination dots */}
      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {highlights.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
