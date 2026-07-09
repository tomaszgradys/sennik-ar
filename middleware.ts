import { NextResponse } from "next/server";

// Logowanie do panelu tymczasowo WYŁĄCZONE — serwis w budowie. Panel oraz endpoint
// logowania zwracają 404: nie ma jak się zalogować ani nie zdradzamy istnienia panelu.
// Docelowo (gdy serwisy będą gotowe) usuwamy ten plik i włączamy hurtem ukryte
// logowanie pod sekretnym adresem + 2FA (kod czeka przygotowany, poza commitem).
export function middleware() {
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: [
    "/panel",
    "/panel/",
    "/panel/:path*",
    "/api/panel/login",
    "/api/panel/login/",
    "/api/panel/login/:path*",
  ],
};
