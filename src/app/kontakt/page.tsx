import type { Metadata } from "next";
import { SITE, LEGAL } from "@/lib/site";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: { absolute: `اتصل بنا — ${SITE.name}` },
  description: `تواصل مع موقع ${SITE.domain}. البريد الإلكتروني وبيانات المشغّل ومعلومات التعاون.`,
  alternates: { canonical: `${SITE.url}/kontakt/` },
};

export default function KontaktPage() {
  return (
    <LegalPage
      title="اتصل بنا"
      intro={`لديك سؤال أو ملاحظة أو اقتراح تعاون؟ اكتب إلينا.`}
    >
      <h2>البريد الإلكتروني</h2>
      <p>
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
      <p>
        نحاول الرد على الرسائل خلال أيام عمل قليلة. في المسائل المتعلقة بالبيانات الشخصية
        نرجو كتابة «بيانات شخصية» في عنوان الرسالة.
      </p>

      <h2>التعاون والإعلان</h2>
      <p>
        لطلبات الإعلان والمقالات المموّلة والتعاون، يرجى التواصل عبر البريد الإلكتروني أعلاه.
      </p>

      <h2>الإبلاغ عن المحتوى</h2>
      <p>
        إن رأيت أن محتوى ما في الموقع يخالف القانون أو حقوقك، فاكتب إلينا. سننظر في البلاغ
        وسنحذف المادة أو نصحّحها في الحالات المبرَّرة.
      </p>
    </LegalPage>
  );
}
