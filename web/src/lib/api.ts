// ─── Configuration ───────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined ?? "https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";
export type AgeBracket = "18-25" | "26-35" | "36-45" | "46-55" | "55+";
export type InterestedIn = "men" | "women" | "both";
export type Membership = "free" | "paid";
export type Decision = "yes" | "pass";

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  gender: Gender;
  age_bracket: AgeBracket;
  travel_region_code: string;
  profession: string;
  interested_in: InterestedIn;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
}

export interface TravelRegion {
  code: string;
  name: string;
}

export interface SignupUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  membership: Membership;
  current_tier: number;
  created_at: string;
}

export interface SignupResponse {
  user: SignupUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginUser {
  id: string;
  email: string;
  username: string;
  alias: string;
  membership: Membership;
  current_tier: number;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
}

export interface Profile {
  alias: string;
  membership: Membership;
  current_tier: number;
  gender: Gender;
  age_bracket: AgeBracket;
  travel_region_code: string;
  travel_region_name?: string;
  location?: string;
  profession: string;
}

export type EventType = "test" | "live";

export interface SpeedRoundEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  room_name: string;
  capacity: number;
  status: string;
  event_type?: EventType;
}

export interface LobbyUser {
  id: string;
  alias: string;
  gender: string;
  age_bracket: string;
  joined_at: string;
}

export interface JoinResult {
  matched: boolean;
  status?: string;
  session_id?: string;
  room_name?: string;
  partner_alias?: string;
  partner_gender?: string;
  partner_age_bracket?: string;
  partner_location?: string;
}

export interface DecisionPayload {
  session_id: string;
  decision: Decision;
}

export interface DecisionResult {
  session_id: string;
  decision: Decision;
  both_decided: boolean;
  matched: boolean;
}

export interface Match {
  connection_id: string;
  matched_at: string;
  alias: string;
  tier: string;
  decision_status: string;
  gender?: string;
  location?: string;
  profession?: string;
  private_note?: string;
  next_call_at?: string;
}

export interface MemberSummary {
  id: string;
  username: string;
  alias: string;
  membership: Membership;
  current_tier: number;
  gender: Gender;
  age_bracket: AgeBracket;
  location: string;
  profession: string;
}

export interface BrowseMembersParams {
  gender?: Gender;
  age_bracket?: AgeBracket;
  location?: string;
  profession?: string;
  limit?: number;
  offset?: number;
}

export interface TwilioTokenResponse {
  token: string;
  room_name: string;
}

export interface PaymentStatus {
  membership: Membership;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  add_ons?: {
    coaching_program?: boolean;
  };
}

export type SlotPeriod = "morning" | "afternoon" | "evening";

export interface TimeSlot {
  date: string;
  period: SlotPeriod;
}

export interface FeedbackPayload {
  session_id: string;
  was_professional: boolean | null;
  felt_unsafe: boolean | null;
  private_note: string;
}

export interface AvailabilityPayload {
  session_id: string;
  slots: TimeSlot[];
}

export interface UpcomingCall {
  id: string;
  session_id: string | null;
  partner_alias: string | null;
  partner_gender?: string;
  partner_age_bracket?: string;
  partner_location?: string;
  scheduled_at: string;
  duration_minutes: number;
  call_type: "follow_up" | "speed_round";
  status: string;
  room_name: string;
  title?: string;
  event_type?: EventType | null;
}

export interface Relationship {
  id: string;
  partner_alias: string;
  stage: string;
  started_at: string;
  last_updated: string;
}

export interface DatePaymentStatus {
  relationship_id: string;
  user_paid: boolean;
  partner_paid: boolean;
  both_paid: boolean;
  payment_deadline: string;
}

export interface EveningSlot {
  date: string;
  time: string; // "18:00" | "18:30" | "19:00" | "19:30"
}

export interface DateBooking {
  id: string;
  relationship_id: string;
  scheduled_at: string;
  venue: string;
  venue_address: string;
  partner_first_name: string;
  status: string;
}

export type VerificationStatus = "not_started" | "requires_input" | "processing" | "verified" | "canceled";

export interface IdentityVerificationResponse {
  relationship_id: string;
  verification_session_id: string;
  verification_status: VerificationStatus;
  client_secret: string;
}

export interface DatePaymentStatusV2 extends DatePaymentStatus {
  user_verification_status?: VerificationStatus;
  partner_verification_status?: VerificationStatus;
  both_verified?: boolean;
}

export interface PostDateFeedbackPayload {
  relationship_id: string;
  rating: number; // 1–5
  highlight: string; // "conversation" | "chemistry" | "venue" | "overall_vibe"
  private_note: string;
  felt_unsafe: boolean;
}

export interface PostDateFeedbackResult {
  success: boolean;
}

export interface ApiError {
  error: string;
}

export interface ApiRequestError extends Error {
  status?: number;
}

// ─── Token management ───────────────────────────────────────────────────────

const TOKEN_KEY = "aur3m_token";
const TOKEN_EXPIRY_KEY = "aur3m_token_expiry";
const SESSION_DURATION_MS = 13 * 30 * 24 * 60 * 60 * 1000; // ~13 months

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > Number(expiry)) {
      // Session expired — clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    authToken = localStorage.getItem(TOKEN_KEY);
  }
  return authToken;
};

export const clearAuth = () => setAuthToken(null);

// ─── HTTP helper ────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" })) as ApiError;
    const err: ApiRequestError = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const api = {
  signup(payload: SignupPayload) {
    return request<SignupResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload) {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getProfile() {
    return request<Profile>("/api/profile");
  },

  getUpcomingSpeedRounds(eventType: EventType = "live") {
    return request<{ event_type: EventType; events: SpeedRoundEvent[] }>(`/api/speed-rounds/upcoming?event_type=${eventType}`);
  },

  enterLobby(eventId: string) {
    return request<{ success: boolean }>("/api/speed-rounds/enter-lobby", {
      method: "POST",
      body: JSON.stringify({ event_id: eventId }),
    });
  },

  leaveLobby(eventId: string) {
    return request<{ success: boolean }>("/api/speed-rounds/leave-lobby", {
      method: "POST",
      body: JSON.stringify({ event_id: eventId }),
    });
  },

  getLobbyUsers(eventId: string) {
    return request<{ lobby_users: LobbyUser[]; matching_users: LobbyUser[]; total_lobby: number; total_matching: number }>(`/api/speed-rounds/lobby?event_id=${encodeURIComponent(eventId)}`);
  },

  joinSpeedRound(eventId: string) {
    return request<JoinResult>("/api/speed-rounds/join", {
      method: "POST",
      body: JSON.stringify({ event_id: eventId }),
    });
  },

  submitDecision(payload: DecisionPayload) {
    return request<DecisionResult>("/api/speed-rounds/decision", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  completeSession(sessionId: string) {
    return request<{ success: boolean }>("/api/speed-rounds/complete-session", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });
  },

  getMatches() {
    return request<{ matches: Match[] }>("/api/matches");
  },

  getTwilioToken(roomName: string) {
    return request<TwilioTokenResponse>("/api/twilio/token", {
      method: "POST",
      body: JSON.stringify({ room_name: roomName }),
    });
  },

  getMembers(params?: BrowseMembersParams) {
    const query = new URLSearchParams();
    if (params?.gender) query.set("gender", params.gender);
    if (params?.age_bracket) query.set("age_bracket", params.age_bracket);
    if (params?.location) query.set("location", params.location);
    if (params?.profession) query.set("profession", params.profession);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return request<{ members: MemberSummary[]; total_count: number }>(`/api/members${qs ? `?${qs}` : ""}`);
  },

  updateProfile(payload: { age_bracket?: AgeBracket; travel_region_code?: string }) {
    return request<Profile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  getTravelRegions() {
    return request<TravelRegion[]>("/api/travel-regions");
  },

  createCheckoutSession(tier: Membership) {
    return request<{ url: string }>("/api/payments/create-checkout", {
      method: "POST",
      body: JSON.stringify({ tier }),
    });
  },

  createAddOnCheckout(addOn: "coaching_program") {
    return request<{ url: string }>("/api/payments/create-checkout", {
      method: "POST",
      body: JSON.stringify({ add_on: addOn }),
    });
  },

  requestPasswordReset(email: string) {
    return request<{ success: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string) {
    return request<{ success: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  resendVerification(email: string) {
    return request<{ success: boolean }>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // ─── Thumbs-up / Priority Interest ──────────────────────────────────────────
  getThumbsUp() {
    return request<{ thumbs_up: string[]; members: MemberSummary[] }>("/api/thumbs-up");
  },

  addThumbsUp(toUserId: string) {
    return request<{ success: boolean; to_user_id: string }>("/api/thumbs-up", {
      method: "POST",
      body: JSON.stringify({ to_user_id: toUserId }),
    });
  },

  removeThumbsUp(toUserId: string) {
    return request<{ success: boolean; to_user_id: string }>(`/api/thumbs-up/${toUserId}`, {
      method: "DELETE",
    });
  },

  getPaymentStatus() {
    return request<PaymentStatus>("/api/payments/status");
  },

  cancelSubscription() {
    return request<PaymentStatus>("/api/payments/cancel", {
      method: "POST",
    });
  },

  // ─── Post-Call Feedback & Scheduling ────────────────────────────────────────
  submitFeedback(payload: FeedbackPayload) {
    return request<{ success: boolean }>("/api/speed-rounds/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  submitAvailability(payload: AvailabilityPayload) {
    return request<{ success: boolean; slots_saved: number }>("/api/speed-rounds/availability", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getUpcomingCalls(eventType: EventType = "live") {
    return request<{ upcoming: UpcomingCall[] }>(`/api/calendar/upcoming?event_type=${eventType}`);
  },

  getRelationships() {
    return request<{ relationships: Relationship[] }>("/api/relationships");
  },

  // ─── Gold Date Booking ──────────────────────────────────────────────────────
  createDatePayment(relationshipId: string) {
    return request<{ url: string }>("/api/dates/create-payment", {
      method: "POST",
      body: JSON.stringify({ relationship_id: relationshipId }),
    });
  },

  getDatePaymentStatus(relationshipId: string) {
    return request<DatePaymentStatus>(`/api/dates/${relationshipId}/payment-status`);
  },

  submitDateAvailability(relationshipId: string, slots: EveningSlot[]) {
    return request<{ success: boolean; slots_saved: number }>("/api/dates/availability", {
      method: "POST",
      body: JSON.stringify({ relationship_id: relationshipId, slots }),
    });
  },

  getDateBooking(relationshipId: string) {
    return request<DateBooking>(`/api/dates/${relationshipId}/booking`);
  },

  submitPostDateFeedback(payload: PostDateFeedbackPayload) {
    return request<PostDateFeedbackResult>("/api/dates/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── Identity Verification ─────────────────────────────────────────────────
  startIdentityVerification(relationshipId: string) {
    return request<IdentityVerificationResponse>("/api/identity/start-verification", {
      method: "POST",
      body: JSON.stringify({ relationship_id: relationshipId }),
    });
  },
};
