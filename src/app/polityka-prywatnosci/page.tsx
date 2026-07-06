import type { Metadata } from "next";
import Link from "next/link";
import { SITE, LEGAL } from "@/lib/site";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: { absolute: `Polityka prywatności — ${SITE.name}` },
  description: `Polityka prywatności serwisu ${SITE.domain}: administrator danych, pliki cookies, reklamy, podstawy prawne (RODO) i Twoje prawa.`,
  alternates: { canonical: `${SITE.url}/polityka-prywatnosci/` },
};

const P = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function PolitykaPage() {
  return (
    <LegalPage
      title="Polityka prywatności"
      intro={`Niniejsza polityka wyjaśnia, jakie dane zbiera serwis ${SITE.domain} („${SITE.name}”), w jakim celu i na jakiej podstawie, oraz jakie prawa Ci przysługują.`}
    >
      <h2>1. Administrator danych</h2>
      <p>
        Administratorem danych osobowych jest <P>{LEGAL.operator}</P>,{" "}
        <P>{LEGAL.operatorForm}</P>, adres: <P>{LEGAL.address}</P>, kontakt:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. Jakie dane zbieramy</h2>
      <p>Podczas korzystania z Serwisu możemy przetwarzać:</p>
      <ul>
        <li>
          dane techniczne zapisywane automatycznie: adres IP, typ przeglądarki i
          urządzenia, przybliżona lokalizacja, data i godzina wizyty, odwiedzane strony;
        </li>
        <li>
          informacje z plików cookies i podobnych technologii (zob. punkt 4);
        </li>
        <li>
          dane, które sam nam przekażesz, np. treść wiadomości e-mail wysłanej na adres
          kontaktowy;
        </li>
        <li>
          dane konta w Dzienniku snów (jeśli je założysz): adres e-mail oraz — przy
          logowaniu Google — imię i zdjęcie profilowe z konta Google; a także sny, które
          sam zapiszesz wraz z opcjonalnymi szczegółami (opis, emocje, osoby, miejsca,
          kolory, notatki);
        </li>
        <li>
          w przyszłości, po uruchomieniu kont premium: adres e-mail i dane niezbędne do
          świadczenia usługi oraz rozliczeń (na podstawie odrębnej informacji).
        </li>
      </ul>

      <h2>3. Cele i podstawy prawne (RODO)</h2>
      <ul>
        <li>
          świadczenie i utrzymanie Serwisu oraz jego bezpieczeństwo — art. 6 ust. 1
          lit. f RODO (prawnie uzasadniony interes);
        </li>
        <li>
          statystyka i ulepszanie treści — art. 6 ust. 1 lit. f RODO, a jeśli wymaga
          zgody na cookies — art. 6 ust. 1 lit. a RODO;
        </li>
        <li>
          wyświetlanie reklam, w tym personalizowanych, przez partnerów — art. 6 ust. 1
          lit. a RODO (Twoja zgoda w oknie zgody cookies);
        </li>
        <li>
          obsługa korespondencji — art. 6 ust. 1 lit. f RODO;
        </li>
        <li>
          usługi płatne (w przyszłości) — art. 6 ust. 1 lit. b oraz lit. c RODO
          (umowa i obowiązki prawne, np. podatkowe).
        </li>
      </ul>

      <h2>4. Pliki cookies</h2>
      <p>
        Serwis używa plików cookies (ciasteczek) oraz podobnych technologii. Dzielimy je
        na:
      </p>
      <ul>
        <li>
          <strong>niezbędne</strong> — konieczne do działania Serwisu, zapamiętania Twoich
          ustawień (np. tryb jasny/ciemny) oraz utrzymania Twojej sesji po zalogowaniu do
          Dziennika snów (ciasteczka logowania); nie wymagają zgody;
        </li>
        <li>
          <strong>analityczne</strong> — pomagają zrozumieć, jak korzystasz z Serwisu;
        </li>
        <li>
          <strong>reklamowe</strong> — pozwalają wyświetlać reklamy, w tym dopasowane do
          Ciebie.
        </li>
      </ul>
      <p>
        Cookies analityczne i reklamowe stosujemy na podstawie Twojej zgody, którą możesz
        wyrazić lub wycofać w oknie zgody wyświetlanym w Serwisie oraz w ustawieniach
        przeglądarki. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania
        sprzed jej wycofania.
      </p>

      <h2>5. Reklamy i partnerzy zewnętrzni</h2>
      <p>
        Serwis może korzystać z sieci reklamowych, w tym Google (np. Google AdSense).
        Partnerzy ci mogą używać plików cookies do wyświetlania reklam na podstawie
        Twoich wcześniejszych wizyt. Zasady przetwarzania danych przez Google opisuje{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
        >
          polityka Google
        </a>
        . Ustawienia reklam Google możesz zmienić na stronie{" "}
        <a
          href="https://adssettings.google.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ustawienia reklam Google
        </a>
        .
      </p>

      <h2>6. Odbiorcy danych</h2>
      <p>
        Dane mogą być powierzane podmiotom, które pomagają nam prowadzić Serwis: dostawcy
        hostingu i infrastruktury (Vercel), dostawcy bazy danych, w której przechowujemy
        konta i wpisy Dziennika snów (Neon), dostawcy logowania społecznościowego (Google —
        jeśli logujesz się kontem Google), dostawcy narzędzi analitycznych i reklamowych
        oraz — w przyszłości — operatorowi płatności. Podmioty te przetwarzają dane wyłącznie
        zgodnie z naszymi instrukcjami lub własnymi politykami prywatności.
      </p>

      <h2>7. Przekazywanie danych poza EOG</h2>
      <p>
        Niektórzy partnerzy (np. Google) mogą przetwarzać dane poza Europejskim Obszarem
        Gospodarczym. Odbywa się to na podstawie mechanizmów zapewniających odpowiedni
        poziom ochrony, np. standardowych klauzul umownych zatwierdzonych przez Komisję
        Europejską.
      </p>

      <h2>8. Okres przechowywania</h2>
      <p>
        Dane techniczne i z cookies przechowujemy przez okres wynikający z ustawień
        danego pliku cookie lub do czasu wycofania zgody. Korespondencję przechowujemy
        przez czas potrzebny do jej obsługi. Dane związane z usługami płatnymi — przez
        okres wymagany przepisami (np. podatkowymi).
      </p>

      <h2>9. Twoje prawa</h2>
      <p>Masz prawo do:</p>
      <ul>
        <li>dostępu do swoich danych oraz otrzymania ich kopii;</li>
        <li>sprostowania (poprawienia) danych;</li>
        <li>usunięcia danych;</li>
        <li>ograniczenia przetwarzania;</li>
        <li>przenoszenia danych;</li>
        <li>wniesienia sprzeciwu wobec przetwarzania;</li>
        <li>wycofania zgody w dowolnym momencie;</li>
        <li>
          wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul.
          Stawki 2, 00-193 Warszawa.
        </li>
      </ul>
      <p>
        Aby skorzystać z tych praw, napisz na{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>10. Konto i dziennik snów</h2>
      <p>
        „Dziennik snów” to opcjonalna, prywatna funkcja. Konto zakładasz przez Google albo
        przez e-mail i hasło. Hasła przechowujemy wyłącznie w postaci zaszyfrowanej (hash
        bcrypt), nigdy jawnie. Podstawą przetwarzania jest umowa o świadczenie usługi drogą
        elektroniczną (art. 6 ust. 1 lit. b RODO).
      </p>
      <ul>
        <li>
          Twoje wpisy są <strong>domyślnie prywatne</strong> — widzisz je tylko Ty. Nie
          udostępniamy ich publicznie ani nie indeksujemy w wyszukiwarkach.
        </li>
        <li>
          Nie wysyłamy treści Twoich snów (opisów, notatek) do narzędzi analitycznych ani
          reklamowych.
        </li>
        <li>
          W przyszłości, w ramach funkcji Premium, będziemy mogli —{" "}
          <strong>wyłącznie na Twoje wyraźne żądanie</strong> — analizować Twoje sny
          (powtarzające się symbole, emocje, motywy) z pomocą sztucznej inteligencji.
          Uruchomimy to na podstawie osobnej zgody lub umowy.
        </li>
        <li>
          W każdej chwili w panelu <Link href="/moj-dziennik">Mój dziennik</Link> możesz
          usunąć pojedynczy sen, wszystkie wpisy albo całe konto. Usunięcie konta trwale
          kasuje Twoje dane.
        </li>
      </ul>

      <h2>11. Zmiany polityki</h2>
      <p>
        Politykę możemy aktualizować, np. przy zmianie przepisów lub zakresu usług.
        Aktualna wersja jest zawsze dostępna na tej stronie. Zobacz też nasz{" "}
        <Link href="/regulamin">Regulamin</Link>.
      </p>
    </LegalPage>
  );
}
