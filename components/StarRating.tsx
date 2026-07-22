type Props = {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

const StarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/**
 * Accessible star rating with true fractional fill.
 *
 * Renders a gray star row with a green row overlaid and clipped to the exact
 * percentage — no per-star SVG gradients (which previously collided on a shared
 * `id="partial"`) and one clean aria-label instead of a raw float.
 */
export default function StarRating({ rating, max = 5, size = "md" }: Props) {
  const clamped = Math.max(0, Math.min(max, rating));
  const pct = (clamped / max) * 100;
  const label = `Rated ${Math.round(clamped * 10) / 10} out of ${max} stars`;
  const sizeClass = sizes[size];

  const row = (colorClass: string) => (
    // w-max keeps the row at its natural width so the clipped overlay renders
    // full-size stars and just gets cut off — without it, the overlay row is
    // constrained to the clip container's width and its stars shrink out of
    // alignment with the gray row beneath.
    <span className={`flex gap-0.5 w-max shrink-0 ${colorClass}`}>
      {Array.from({ length: max }, (_, i) => (
        <StarIcon key={i} className={sizeClass} />
      ))}
    </span>
  );

  return (
    <span role="img" aria-label={label} className="relative inline-flex w-max">
      {row("text-gray-200")}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {row("text-green-500")}
      </span>
    </span>
  );
}
