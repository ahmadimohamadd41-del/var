/** فرمت‌کننده‌های فارسی — ارقام فارسی، تومان، گیگابایت، تاریخ شمسی */

export const GB = 1024 ** 3;
export const MB = 1024 ** 2;

const faInt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const faDec = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const faDateFmt = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  month: "long",
});
const faTimeFmt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

export const faNum = (n: number) => faInt.format(Math.round(n));

export const faDec1 = (n: number) => faDec.format(n);

export const toman = (n: number) => `${faInt.format(Math.round(n))} تومان`;

export const tomanShort = (n: number) => {
  if (n >= 1_000_000) return `${faDec.format(n / 1_000_000)} میلیون`;
  if (n >= 1_000) return `${faInt.format(n / 1_000)} هزار`;
  return faInt.format(n);
};

export const gbOf = (bytes: number) => faDec.format(bytes / GB);

export const gbLabel = (gb: number) => `${faInt.format(gb)} گیگابایت`;

export const faDate = (iso: string) => faDateFmt.format(new Date(iso));

export const faTime = (iso: string) => {
  const d = new Date(iso);
  const h = faTimeFmt.format(d.getHours());
  const m = faTimeFmt.format(d.getMinutes()).padStart(2, "۰");
  return `${h}:${m}`;
};

export const faClockNow = () => {
  const d = new Date();
  return `${faTimeFmt.format(d.getHours())}:${faTimeFmt
    .format(d.getMinutes())
    .padStart(2, "۰")}`;
};

export const daysLeft = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

export const daysLeftLabel = (iso: string) => {
  const d = daysLeft(iso);
  if (d <= 0) return "منقضی شده";
  if (d === 1) return "۱ روز مانده";
  return `${faNum(d)} روز مانده`;
};

export const pct = (used: number, quota: number) =>
  Math.min(100, Math.round((used / Math.max(quota, 1)) * 100));
