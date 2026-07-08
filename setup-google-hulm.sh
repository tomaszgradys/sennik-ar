#!/usr/bin/env bash
# Jednorazowy skrypt: włącza logowanie Google na hulm.pro (projekt Vercel: sennik-ar).
# Pobiera GOOGLE_CLIENT_SECRET z projektu sennik (PL) i ustawia 3 zmienne na hulm.
# Uruchom z katalogu Desktop:  bash sennik-ar/setup-google-hulm.sh
set -e

PL="C:/Users/Administrator/Desktop/sennik"
AR="C:/Users/Administrator/Desktop/sennik-ar"
TMP="$(mktemp).env"

CLIENT_ID="524942744756-1i4rgm72ut1hjbeb1d0lsg9psb14csri.apps.googleusercontent.com"

echo "1/4  Pobieram GOOGLE_CLIENT_SECRET z sennik.tv…"
( cd "$PL" && vercel env pull "$TMP" --environment production --yes >/dev/null )
CLIENT_SECRET="$(grep -E '^GOOGLE_CLIENT_SECRET=' "$TMP" | cut -d= -f2- | tr -d '"')"
rm -f "$TMP"
if [ -z "$CLIENT_SECRET" ]; then echo "BŁĄD: nie udało się odczytać sekretu z PL"; exit 1; fi

echo "2/4  Ustawiam GOOGLE_CLIENT_ID na hulm…"
( cd "$AR" && printf '%s' "$CLIENT_ID"     | vercel env add GOOGLE_CLIENT_ID production --force )

echo "3/4  Ustawiam GOOGLE_CLIENT_SECRET na hulm…"
( cd "$AR" && printf '%s' "$CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --force )

echo "4/4  Ustawiam świeży SESSION_SECRET na hulm…"
SS="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")"
( cd "$AR" && printf '%s' "$SS"            | vercel env add SESSION_SECRET production --force )

echo
echo "Gotowe. Teraz wdróż produkcję:"
echo "   cd \"$AR\" && vercel --prod"
