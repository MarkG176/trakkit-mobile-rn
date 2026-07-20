import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'app_language';

const translations: Record<string, Record<Language, string>> = {
  today: { en: 'Today', sw: 'Leo' },
  all_time: { en: 'All Time', sw: 'Jumla Yote' },
  activity_attendance: { en: 'Activity & Attendance', sw: 'Shughuli & Mahudhurio' },
  tasks: { en: 'Tasks', sw: 'Kazi' },
  sales_revenue: { en: 'Sales & Revenue', sw: 'Mauzo & Mapato' },
  engagement: { en: 'Engagement', sw: 'Mawasiliano' },
  points_rank: { en: 'Points & Rank', sw: 'Pointi & Cheo' },
  account: { en: 'Account', sw: 'Akaunti' },
  store_visits: { en: 'Store Visits', sw: 'Ziara za Duka' },
  check_ins: { en: 'Check-ins', sw: 'Kuingia Kazini' },
  work_time: { en: 'Work Time', sw: 'Muda wa Kazi' },
  stores_added: { en: 'Stores Added', sw: 'Maduka Yaliyoongezwa' },
  total_tasks: { en: 'Total Tasks', sw: 'Kazi Zote' },
  completed: { en: 'Completed', sw: 'Zilizokamilika' },
  pending: { en: 'Pending', sw: 'Zinazosubiri' },
  products_sold: { en: 'Products Sold', sw: 'Bidhaa Zilizouzwa' },
  revenue: { en: 'Revenue', sw: 'Mapato' },
  sales_made: { en: 'Sales Made', sw: 'Mauzo Yaliyofanywa' },
  giveaways: { en: 'Giveaways', sw: 'Zawadi/Sampuli' },
  interactions: { en: 'Interactions', sw: 'Maingiliano' },
  surveys_done: { en: 'Surveys Done', sw: 'Utafiti Uliofanywa' },
  items_given: { en: 'Items Given', sw: 'Vitu Vilivyotolewa' },
  notes: { en: 'Notes', sw: 'Maelezo' },
  rank: { en: 'Rank', sw: 'Cheo' },
  total_points: { en: 'Total Points', sw: 'Pointi Zote' },
  logout: { en: 'Logout', sw: 'Toka' },
  settings: { en: 'Settings', sw: 'Mipangilio' },
  language: { en: 'Language', sw: 'Lugha' },
  notifications: { en: 'Notifications', sw: 'Arifa' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'sw') setLanguageState(stored);
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    void AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string): string => translations[key]?.[language] || key,
    [language],
  );

  if (!ready) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
