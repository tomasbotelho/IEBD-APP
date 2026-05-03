export const BrandLogo = ({ className = "h-12" }) => (
  <>
    <img
      alt="Sports Club"
      className={`${className} w-auto rounded-[1rem] object-contain`}
      src="/logo-sports-club.png"
    />
    <span className="sr-only">Sports Club</span>
  </>
);
