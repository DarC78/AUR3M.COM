import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { captureUtmParams } from "@/lib/utm";

captureUtmParams();
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage.tsx";
import BrowseMembersPage from "./pages/BrowseMembersPage.tsx";
import FAQPage from "./pages/FAQPage.tsx";
import LobbyPage from "./pages/LobbyPage.tsx";
import CallPage from "./pages/CallPage.tsx";
import DateBookingPage from "./pages/DateBookingPage.tsx";
import DateConfirmationPage from "./pages/DateConfirmationPage.tsx";
import PostDateFeedbackPage from "./pages/PostDateFeedbackPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import SubscriptionPage from "./pages/SubscriptionPage.tsx";
import InterestingPeoplePage from "./pages/InterestingPeoplePage.tsx";
import MatchDetailPage from "./pages/MatchDetailPage.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/members" element={<BrowseMembersPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/call/:callId" element={<CallPage />} />
          <Route path="/date/:relationshipId" element={<DateBookingPage />} />
          <Route path="/date/:relationshipId/confirmed" element={<DateConfirmationPage />} />
          <Route path="/date/:relationshipId/feedback" element={<PostDateFeedbackPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/interesting" element={<InterestingPeoplePage />} />
          <Route path="/match/:connectionId" element={<MatchDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
