export const THEME_KEY = "sennik-theme";

export type ThemeMode = "light" | "dark";

// Normalizuje wartość z localStorage (w tym starą, wycofaną 'auto') → 'light'|'dark'.
// Domyślnie ZAWSZE noc (ciemny) — decyzja Tomasza.
export function resolveTheme(mode: string | null | undefined): ThemeMode {
  return mode === "light" ? "light" : "dark";
}

// Filtr niebieskiego światła jest ZAWSZE włączony (decyzja Tomasza) —
// siła zależy tylko od pory dnia (silniejszy wieczorem/nocą), niezależnie od motywu.
export function blfStrength(d: Date = new Date()): number {
  const h = d.getHours();
  if (h < 7 || h >= 20) return 0.2;
  if (h >= 18) return 0.14;
  return 0.06;
}

// Skrypt wstawiany do <head>, wykonywany przed pierwszym renderem — zapobiega
// migotaniu (FOUC). Domyślnie noc; tylko jawny wybór 'light' daje jasny motyw.
export const THEME_INIT_SCRIPT = `(function(){try{
var t=localStorage.getItem('${THEME_KEY}');
var r=t==='light'?'light':'dark';
var h=new Date().getHours();var night=h<7||h>=20;var eve=h>=18&&h<20;
document.documentElement.dataset.theme=r;
document.documentElement.style.setProperty('--blf',String(night?0.2:(eve?0.14:0.06)));
if(localStorage.getItem('sennik-3d')==='1')document.documentElement.classList.add('threed');
}catch(e){}})();`;
