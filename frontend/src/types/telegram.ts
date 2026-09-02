/**
 * Telegram WebApp types and API wrapper
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  isSettingsButtonVisible: boolean;
  
  ready(): void;
  expand(): void;
  close(): void;
  showMainButton(text: string, onClick: () => void): void;
  hideMainButton(): void;
  MainButton: MainButton;
  BackButton: BackButton;
  showAlert(message: string): void;
  showConfirm(message: string, callback: (confirmed: boolean) => void): void;
  showPopup(params: PopupParams, callback: (buttonId: string) => void): void;
  hapticFeedback: HapticFeedback;
}

export interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
  header_bg_color: string;
}

export interface MainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive: boolean): void;
  hideProgress(): void;
  setText(text: string): void;
  setParams(params: { text?: string; color?: string; textColor?: string }): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

export interface BackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

export interface PopupParams {
  title?: string;
  message: string;
  buttons?: PopupButton[];
}

export interface PopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text?: string;
}

export interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'success' | 'warning' | 'error'): void;
  selectionChanged(): void;
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegramWebApp(): TelegramWebApp | null {
  if (window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    return webApp;
  }
  return null;
}

/**
 * Get Telegram initData for API authentication
 */
export function getTelegramInitData(): string | null {
  const webApp = initTelegramWebApp();
  return webApp?.initData || null;
}

/**
 * Get current Telegram user
 */
export function getTelegramUser(): TelegramUser | null {
  const webApp = initTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}
