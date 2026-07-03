import { useCallback } from 'react';
import supabase from './supabase';

export function useAuthFetch() {
  return useCallback(async (path: string, opts: RequestInit = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }, []);
}
