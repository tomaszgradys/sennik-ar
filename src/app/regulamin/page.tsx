import type { Metadata } from "next";
import Link from "next/link";
import { SITE, LEGAL } from "@/lib/site";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: { absolute: `Regulamin — ${SITE.name}` },
  description: `Regulamin serwisu ${SITE.domain}: zasady korzystania, charakter treści, prawa autorskie, reklamy i reklamacje.`,
  alternates: { canonical: `${SITE.url}/regulamin/` },
};

const P = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function RegulaminPage() {
  return (
    <LegalPage
      title="Regulamin serwisu"
      intro={`Regulamin określa zasady korzystania z serwisu internetowego ${SITE.domain} („${SITE.name}”).`}
    >
      <h2>§1. Postanowienia ogólne</h2>
      <p>
        1. Właścicielem i operatorem serwisu {SITE.domain} (dalej „Serwis”) jest{" "}
        <P>{LEGAL.operator}</P>, <P>{LEGAL.operatorForm}</P>, adres:{" "}
        <P>{LEGAL.address}</P> (dalej „Usługodawca”).
      </p>
      <p>
        2. Kontakt z Usługodawcą jest możliwy pod adresem e-mail:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> oraz na stronie{" "}
        <Link href="/kontakt">Kontakt</Link>.
      </p>
      <p>
        3. Użytkownikiem jest każda osoba korzystająca z Serwisu. Korzystanie z Serwisu
        oznacza akceptację niniejszego Regulaminu.
      </p>

      <h2>§2. Rodzaj i zakres usług</h2>
      <p>
        1. Serwis udostępnia bezpłatnie treści o charakterze informacyjnym i
        refleksyjnym: interpretacje snów (sennik), horoskopy, informacje o fazach
        Księżyca oraz treści powiązane.
      </p>
      <p>
        2. Zalogowani Użytkownicy mogą bezpłatnie korzystać z „Dziennika snów” — prywatnej
        funkcji zapisywania własnych snów (zob. §8).
      </p>
      <p>
        3. W przyszłości Serwis może udostępniać dodatkowe funkcje płatne (np. dostęp
        bez reklam, funkcje premium). Zasady takich usług zostaną określone w odrębnym
        regulaminie lub w rozszerzeniu niniejszego dokumentu przed ich uruchomieniem.
      </p>

      <h2>§3. Charakter treści i zastrzeżenia</h2>
      <p>
        1. Treści w Serwisie, w szczególności interpretacje snów i horoskopy, mają
        charakter informacyjny i refleksyjny. Nie stanowią porady medycznej,
        psychologicznej, prawnej ani finansowej i nie mogą ich zastępować.
      </p>
      <p>
        2. Usługodawca nie gwarantuje, że treści są kompletne lub w pełni aktualne, i
        nie ponosi odpowiedzialności za decyzje podjęte na ich podstawie. W sprawach
        zdrowia, finansów lub prawa należy skonsultować się z odpowiednim specjalistą.
      </p>

      <h2>§4. Warunki techniczne</h2>
      <p>
        Do korzystania z Serwisu wystarczy urządzenie z dostępem do internetu i
        aktualną przeglądarką z włączoną obsługą JavaScript. Serwis używa plików
        cookies (zob. <Link href="/polityka-prywatnosci">Politykę prywatności</Link>).
      </p>

      <h2>§5. Prawa autorskie</h2>
      <p>
        1. Treści Serwisu (teksty, grafiki, układ, logo) są chronione prawem autorskim i
        stanowią własność Usługodawcy lub są wykorzystywane na podstawie odpowiednich
        licencji.
      </p>
      <p>
        2. Kopiowanie, rozpowszechnianie lub inne wykorzystywanie treści bez zgody
        Usługodawcy, poza dozwolonym użytkiem osobistym, jest zabronione.
      </p>

      <h2>§6. Reklamy</h2>
      <p>
        Serwis utrzymuje się m.in. z reklam i może wyświetlać reklamy dostarczane przez
        partnerów zewnętrznych (np. Google). Zasady przetwarzania danych w związku z
        reklamami opisuje <Link href="/polityka-prywatnosci">Polityka prywatności</Link>.
      </p>

      <h2>§7. Reklamacje</h2>
      <p>
        1. Uwagi i reklamacje dotyczące działania Serwisu można zgłaszać na adres{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
      <p>
        2. Reklamacja powinna zawierać opis problemu oraz dane kontaktowe. Usługodawca
        rozpatruje reklamacje w terminie do 14 dni.
      </p>

      <h2>§8. Konto i Dziennik snów</h2>
      <p>
        1. „Dziennik snów” to bezpłatna, opcjonalna funkcja pozwalająca zapisywać własne sny
        w prywatnym panelu. Konto zakładasz przez Google albo przez adres e-mail i hasło.
      </p>
      <p>
        2. Wpisy w Dzienniku są domyślnie prywatne — widoczne wyłącznie dla Ciebie po
        zalogowaniu. Nie są publikowane w Serwisie ani indeksowane w wyszukiwarkach.
      </p>
      <p>
        3. Zobowiązujesz się podawać prawdziwy adres e-mail, chronić dane logowania i nie
        udostępniać konta osobom trzecim. Odpowiadasz za treści, które zapisujesz na koncie.
      </p>
      <p>
        4. Zabronione jest korzystanie z konta i funkcji Serwisu w sposób niezgodny z prawem,
        do treści bezprawnych, a także działania zagrażające bezpieczeństwu lub ciągłości
        Serwisu (np. automatyczne masowe zapytania).
      </p>
      <p>
        5. W każdej chwili możesz usunąć pojedynczy wpis, wszystkie wpisy albo całe konto w
        panelu <Link href="/moj-dziennik">Mój dziennik</Link>. Usunięcie konta trwale kasuje
        powiązane z nim dane.
      </p>
      <p>
        6. Usługodawca może zawiesić lub usunąć konto rażąco naruszające Regulamin lub
        przepisy prawa, a także zakończyć albo zmienić bezpłatne funkcje, informując o tym w
        Serwisie. Zasady przetwarzania danych konta opisuje{" "}
        <Link href="/polityka-prywatnosci">Polityka prywatności</Link>.
      </p>

      <h2>§9. Postanowienia końcowe</h2>
      <p>
        1. Usługodawca może zmienić Regulamin z ważnych przyczyn (np. zmiana przepisów,
        zakresu usług). Zmiany obowiązują od dnia publikacji nowej wersji w Serwisie.
      </p>
      <p>
        2. W sprawach nieuregulowanych stosuje się prawo polskie oraz właściwe przepisy
        Unii Europejskiej. Ewentualne spory rozstrzyga sąd właściwy według przepisów.
      </p>
    </LegalPage>
  );
}
