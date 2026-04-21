"use client";

import useSWR, { type SWRConfiguration } from "swr";

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

export function useLive<T>(url: string, opts?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    ...opts,
  });
}
