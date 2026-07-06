// Włączniki monetyzacji i promocji aplikacji. Wszystko domyślnie WYŁĄCZONE —
// włączamy przez zmianę flagi (lub env), bez przebudowy kodu.

export const ADS = {
  // Włączyć po założeniu i zatwierdzeniu konta AdSense (potem ew. Mediavine/Raptive
  // po osiągnięciu progów ruchu — wymagają ~50k sesji/mc).
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "1",
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "", // np. "ca-pub-1234567890"
  // Auto Ads: Google sam dokłada m.in. vignette (pełnoekranowa reklama między
  // podstronami — zgodny z zasadami odpowiednik "reklamy, która sama się otwiera")
  // oraz kotwicę u dołu ekranu. Sloty ręczne poniżej to dodatek w treści.
  autoAds: true,
  slots: {
    inArticle: "", // ID slotu z panelu AdSense
    belowInterpretation: "",
    homeMiddle: "",
  },
};

export const APP_PROMO = {
  // Włącznik zachęt do pobrania aplikacji — włączyć, gdy apka będzie w sklepach.
  enabled: false,
  androidUrl: "",
  iosUrl: "",
};
