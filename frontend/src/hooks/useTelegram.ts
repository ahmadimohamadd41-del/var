import { useEffect, useState } from 'react';
import { initTelegramWebApp, getTelegramInitData, TelegramUser } from '../types/telegram';

/**
 * Hook to manage Telegram WebApp state
 */
export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const webApp = initTelegramWebApp();
    
    if (webApp) {
      // Set theme based on Telegram color scheme
      setTheme(webApp.colorScheme);
      
      // Get user data
      const telegramUser = webApp.initDataUnsafe?.user || null;
      setUser(telegramUser);
      
      // Get initData for API auth
      const data = webApp.initData;
      setInitData(data);
      
      // Expand the app
      webApp.expand();
      
      // Mark as ready
      setIsReady(true);
      
      // Set header color
      webApp.setHeaderColor('#0f0f0f');
    } else {
      // Running outside Telegram (development mode)
      console.warn('Telegram WebApp not available - running in development mode');
      setIsReady(true);
    }
  }, []);

  return { isReady, user, initData, theme };
}
