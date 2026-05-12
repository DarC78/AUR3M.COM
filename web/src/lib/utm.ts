import type { EventType } from "@/lib/api";

const UTM_CAMPAIGN_KEY = "aur3m_utm_campaign";
const UTM_SOURCE_KEY = "aur3m_utm_source";
const UTM_MEDIUM_KEY = "aur3m_utm_medium";
const EVENT_MODE_KEY = "aur3m_event_mode";

/** Call once on app init to capture UTM params from the URL and persist them. */
export function captureUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("UTM_CAMPAIGN");
  const source = params.get("UTM_SOURCE");
  const medium = params.get("UTM_MEDIUM");
  if (campaign) sessionStorage.setItem(UTM_CAMPAIGN_KEY, campaign);
  if (source) sessionStorage.setItem(UTM_SOURCE_KEY, source);
  if (medium) sessionStorage.setItem(UTM_MEDIUM_KEY, medium);
}

export function getUtmCampaign(): string | null {
  return sessionStorage.getItem(UTM_CAMPAIGN_KEY);
}

export function getUtmSource(): string | null {
  return sessionStorage.getItem(UTM_SOURCE_KEY);
}

export function getUtmMedium(): string | null {
  return sessionStorage.getItem(UTM_MEDIUM_KEY);
}

export interface UtmParams {
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
}

export function getUtmParams(): UtmParams {
  const result: UtmParams = {};
  const campaign = getUtmCampaign();
  const source = getUtmSource();
  const medium = getUtmMedium();
  if (campaign) result.utm_campaign = campaign;
  if (source) result.utm_source = source;
  if (medium) result.utm_medium = medium;
  return result;
}

export function isTestCampaign(): boolean {
  return getUtmCampaign() === "test";
}

/** Returns the default event mode based on UTM_CAMPAIGN. */
export function getDefaultEventMode(): EventType {
  return isTestCampaign() ? "test" : "live";
}

/** Get the currently selected event mode (user override or UTM default). */
export function getEventMode(): EventType {
  const override = sessionStorage.getItem(EVENT_MODE_KEY);
  if (override === "test" || override === "live") return override;
  return getDefaultEventMode();
}

/** Set the event mode override. */
export function setEventMode(mode: EventType) {
  sessionStorage.setItem(EVENT_MODE_KEY, mode);
}
