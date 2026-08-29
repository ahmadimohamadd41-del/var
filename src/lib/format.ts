export const GB = 1024 ** 3;

const faNum = new Intl.NumberFormat("fa-IR");
const faNum1 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const faDate = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });
const faDateFull = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" });
const faTime = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

export const fa = (n: number | string) => faNum.format(Number(n));
export const fa1 = (n: number) => faNum1.format(n);
export const money = (n: number) => `${faNum.format(n)} تومان`;
export const compactToman = (n: number) =>
  n >= 1_000_000 ? `${faNum1.format(n / 1_000_000)} میلیون تومان` : `${faNum.format(n)} تومان`;

export const gbOf = (bytes: number) => bytes / GB;
export const faGb = (bytes: number) => `${faNum1.format(bytes / GB)} گیگابایت`;
export const faGbShort = (bytes: number) => `${faNum1.format(bytes / GB)} GB`;

export const dateFa = (t: number) => faDate.format(t);
export const dateFullFa = (t: number) => faDateFull.format(t);
export const timeFa = (t: number) => faTime.format(t);

export function agoFa(t: number): string {
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "همین حالا";
  if (m < 60) return `${fa(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${fa(h)} ساعت پیش`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${fa(days)} روز پیش`;
  return dateFa(t);
}

export function daysLeft(t: number): number {
  return Math.ceil((t - Date.now()) / 86_400_000);
}

export function remainFa(t: number): string {
  const ms = t - Date.now();
  if (ms <= 0) return "منقضی شده";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d <= 0) return `${fa(h)} ساعت مانده`;
  return h > 0 ? `${fa(d)} روز و ${fa(h)} ساعت مانده` : `${fa(d)} روز مانده`;
}

export function pct(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.min(100, Math.round((used / quota) * 100));
}

export function maskCard(num: string): string {
  const d = num.replace(/\D/g, "");
  if (d.length < 8) return num;
  return `•••• ${d.slice(-4)}`;
}

export function ltrDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)));
}

export function genPassword(len = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@$";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const dayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function last7DayLabels(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push(dayNames[(d.getDay() + 1) % 7]);
  }
  return out;
}
