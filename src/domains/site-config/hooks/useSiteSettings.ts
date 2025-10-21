'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase';

/**
 * 클라이언트에서 공개 사이트 설정을 가져오는 hook
 */
export function usePublicSiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('is_public', true);

      if (!error && data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        setSettings(settingsMap);
      }

      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
}

/**
 * 특정 설정값을 가져오는 hook
 */
export function useSiteSetting(key: string, defaultValue: any = null) {
  const { settings, isLoading } = usePublicSiteSettings();
  return { value: settings[key] ?? defaultValue, isLoading };
}
