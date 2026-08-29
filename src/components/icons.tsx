import type { ReactNode } from "react";

function I({
  children,
  className = "h-5 w-5",
  sw = 1.8,
}: {
  children: ReactNode;
  className?: string;
  sw?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { className?: string; sw?: number };

export const IcLogo = ({ className = "h-8 w-8" }: P) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path
      d="M24 4l16 6v12c0 10.5-6.8 18.4-16 22-9.2-3.6-16-11.5-16-22V10l16-6z"
      fill="rgba(35,201,147,0.14)"
      stroke="#46dca8"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path
      d="M16 20.5a11.3 11.3 0 0 1 16 0M19 24.5a7 7 0 0 1 10 0M22 28.5a2.9 2.9 0 0 1 4 0"
      stroke="#46dca8"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="24" cy="33" r="1.9" fill="#f6bd5a" />
  </svg>
);

export const IcStore = (p: P) => (
  <I {...p}>
    <path d="M4 10l1.5-5h13L20 10" />
    <path d="M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 10" />
    <path d="M5 12.5V20h14v-7.5" />
    <path d="M9.5 20v-4.5h5V20" />
  </I>
);

export const IcServer = (p: P) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="7" rx="1.6" />
    <rect x="3" y="13" width="18" height="7" rx="1.6" />
    <path d="M7 7.5h.01M7 16.5h.01M17 7.5h-3M17 16.5h-3" />
  </I>
);

export const IcUser = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </I>
);

export const IcUsers = (p: P) => (
  <I {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
    <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.8 13.9a6.2 6.2 0 0 1 3.4 5.6" />
  </I>
);

export const IcWallet = (p: P) => (
  <I {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9z" />
    <path d="M15 12h5v3h-5a1.5 1.5 0 0 1 0-3z" />
    <path d="M4 9h10" />
  </I>
);

export const IcGear = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.36.95a7 7 0 0 0-2.42-1.4L13.7 2.6h-3.4l-.38 2.54a7 7 0 0 0-2.42 1.4l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 2 3.46 2.36-.95a7 7 0 0 0 2.42 1.4l.38 2.54h3.4l.38-2.54a7 7 0 0 0 2.42-1.4l2.36.95 2-3.46-2-1.55c.09-.46.14-.92.14-1.4z" />
  </I>
);

export const IcCheck = (p: P) => (
  <I {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </I>
);

export const IcX = (p: P) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
);

export const IcClock = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
);

export const IcAlert = (p: P) => (
  <I {...p}>
    <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" />
    <path d="M12 10v4M12 17.2h.01" />
  </I>
);

export const IcDownload = (p: P) => (
  <I {...p}>
    <path d="M12 4v10m0 0l-4-4m4 4l4-4" />
    <path d="M4.5 16.5V19a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 19v-2.5" />
  </I>
);

export const IcCopy = (p: P) => (
  <I {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M5.5 14.5h-.7A1.8 1.8 0 0 1 3 12.7V4.8A1.8 1.8 0 0 1 4.8 3h7.9a1.8 1.8 0 0 1 1.8 1.8v.7" />
  </I>
);

export const IcRefresh = (p: P) => (
  <I {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 3.5V8h-4.5" />
  </I>
);

export const IcChevron = (p: P) => (
  <I {...p}>
    <path d="M6 9l6 6 6-6" />
  </I>
);

export const IcPlus = (p: P) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const IcMinus = (p: P) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
);

export const IcReceipt = (p: P) => (
  <I {...p}>
    <path d="M6 3.5h12V21l-2.4-1.5L13.2 21l-2.4-1.5L8.4 21 6 19.5V3.5z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </I>
);

export const IcPulse = (p: P) => (
  <I {...p}>
    <path d="M3 12h4l2.5-6 4 12L16 12h5" />
  </I>
);

export const IcPlane = (p: P) => (
  <I {...p}>
    <path d="M21 4L3.5 10.8l6.2 2.5L12.5 20l3-6L21 4z" />
    <path d="M9.7 13.3L21 4" />
  </I>
);

export const IcDb = (p: P) => (
  <I {...p}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
    <path d="M4.5 5.5v13c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-13" />
    <path d="M4.5 12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8" />
  </I>
);

export const IcKey = (p: P) => (
  <I {...p}>
    <circle cx="8" cy="14.5" r="4" />
    <path d="M11 11.5L20 3m-3.5 3.5L19 9m-5-2.5L16.5 9" />
  </I>
);

export const IcEye = (p: P) => (
  <I {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);

export const IcEyeOff = (p: P) => (
  <I {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3 3.8M6.1 8.3A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 3.9-.85" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </I>
);

export const IcWrench = (p: P) => (
  <I {...p}>
    <path d="M14.5 6.5a4.5 4.5 0 0 0 5.7 5.7L15 17.4a2.1 2.1 0 0 1-3-3l5.2-5.2a4.5 4.5 0 0 0-5.7-5.7l2.6 2.6-.5 3.1-3.1.5-2.6-2.6z" />
  </I>
);

export const IcZap = (p: P) => (
  <I {...p}>
    <path d="M13 2.5L4.5 13.5H11l-1 8L18.5 10H12l1-7.5z" />
  </I>
);

export const IcLock = (p: P) => (
  <I {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </I>
);

export const IcCard = (p: P) => (
  <I {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
    <path d="M2.5 9.5h19M6.5 15h4" />
  </I>
);

export const IcGlobe = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5z" />
  </I>
);

export const IcBan = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6l12 12" />
  </I>
);

export const IcShield = (p: P) => (
  <I {...p}>
    <path d="M12 3l7.5 2.8v6c0 4.9-3.2 8.6-7.5 10.2-4.3-1.6-7.5-5.3-7.5-10.2v-6L12 3z" />
    <path d="M8.8 12l2.2 2.2 4.2-4.4" />
  </I>
);
