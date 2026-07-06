// Zgoda na cookies zgodna z Google Consent Mode v2 (pod GA4, GSC, AdSense w UE).
// Domyślnie WSZYSTKO odrzucone (RODO), dopóki użytkownik nie wyrazi zgody.
export const CONSENT_KEY = "sennik-consent";

export interface Consent {
  analytics: boolean; // Google Analytics
  marketing: boolean; // reklamy (AdSense)
  ts: number;
}

// Skrypt w <head> PRZED skryptami Google: ustawia domyślną zgodę na „denied",
// a jeśli użytkownik już wybrał — natychmiast aktualizuje (bez migotania).
export const CONSENT_INIT_SCRIPT = `(function(){
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',{
ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',
analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',
wait_for_update:500});
try{var c=JSON.parse(localStorage.getItem('${CONSENT_KEY}')||'null');
if(c){gtag('consent','update',{
ad_storage:c.marketing?'granted':'denied',
ad_user_data:c.marketing?'granted':'denied',
ad_personalization:c.marketing?'granted':'denied',
analytics_storage:c.analytics?'granted':'denied'});}}catch(e){}
})();`;
