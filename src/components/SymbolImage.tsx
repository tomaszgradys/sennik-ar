import DreamImage from "./DreamImage";
import { thumbSrc } from "@/lib/dream";

// Miniatura/ilustracja symbolu: prawdziwy obrazek (FLUX) jeśli już wygenerowany,
// inaczej deterministyczna grafika SVG jako fallback. Jedno miejsce, żeby lista
// i strona hasła zawsze pokazywały to samo.
export default function SymbolImage({
  symbolSlug,
  label,
  className = "",
}: {
  symbolSlug: string;
  label: string;
  className?: string;
}) {
  // Delikatny zoom pod maską karty przy najechaniu (efekt „oddychania").
  const zoom = "transition-transform duration-700 ease-out group-hover:scale-[1.04]";
  const src = thumbSrc(symbolSlug); // lekki WebP 256px zamiast pełnego 1024px
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- lokalny plik, zoptymalizowany przy generacji
      <img
        src={src}
        alt={`Ilustracja snu: ${label}`}
        width={512}
        height={384}
        loading="lazy"
        decoding="async"
        className={`object-cover ${zoom} ${className}`}
      />
    );
  }
  return (
    <DreamImage seed={symbolSlug} label={label} className={`${zoom} ${className}`} />
  );
}
