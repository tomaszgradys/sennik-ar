import type { Metadata } from "next";
import { SITE, LEGAL } from "@/lib/site";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: { absolute: `Kontakt — ${SITE.name}` },
  description: `Skontaktuj się z serwisem ${SITE.domain}. Adres e-mail, dane operatora i informacje o współpracy.`,
  alternates: { canonical: `${SITE.url}/kontakt/` },
};

const P = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function KontaktPage() {
  return (
    <LegalPage
      title="Kontakt"
      intro={`Masz pytanie, uwagę albo propozycję współpracy? Napisz do nas.`}
    >
      <h2>Adres e-mail</h2>
      <p>
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
      <p>
        Na wiadomości staramy się odpowiadać w ciągu kilku dni roboczych. W sprawach
        dotyczących danych osobowych (RODO) prosimy o dopisek „dane osobowe” w tytule.
      </p>

      <h2>Dane operatora serwisu</h2>
      <p>
        Serwis {SITE.domain} („{SITE.name}”) prowadzi <P>{LEGAL.operator}</P>,{" "}
        <P>{LEGAL.operatorForm}</P>, z adresem: <P>{LEGAL.address}</P>. NIP:{" "}
        <P>{LEGAL.nip}</P>.
      </p>

      <h2>Współpraca i reklama</h2>
      <p>
        W sprawach reklamowych, artykułów sponsorowanych i współpracy prosimy o kontakt
        pod powyższym adresem e-mail.
      </p>

      <h2>Zgłoszenia treści</h2>
      <p>
        Jeśli uważasz, że jakaś treść w serwisie narusza prawo lub Twoje prawa, napisz
        do nas — rozpatrzymy zgłoszenie i w uzasadnionych przypadkach usuniemy lub
        poprawimy materiał.
      </p>
    </LegalPage>
  );
}
