// src/App.tsx
// React import not required with new JSX transform
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayoutRoute from "./routes/AppLayoutRoute";
import { useAuth } from "./context/AuthContext";
import TopProgressBar from "./components/TopProgressBar";
import ToastHost from "./components/ToastHost";
import ErrorBoundary from "./components/ErrorBoundary";
import CourseDetail from "./pages/CourseDetail"
import CourseCheckout from "./pages/CourseCheckout"
import PaymentReturn from "./pages/PaymentReturn"
import StudentCourse from "./pages/StudentCourse"
import MyExercises from "./pages/MyExercises"
import ExerciseSubmit from "./pages/ExerciseSubmit"
import LessonPage from "./pages/LessonPage"
import ReviewsAssigned from "./pages/ReviewsAssigned"
import ReviewSubmission from "./pages/ReviewSubmission"
import ReviewsHistory from "./pages/ReviewsHistory"
import Community from "./pages/Community"
import Gallery from "./pages/Gallery"
import Discussions from "./pages/Discussions"
import Achievements from "./pages/Achievements"
import { ProtectedRoute, RoleRoute } from "./routes/ProtectedRoute";
import { PeerReview } from "@/components/figma/PeerReview";
// TeacherChoicesPage removed - use sidebar inbox (TeacherDecisionNav) instead
import CoursesList from "./pages/CoursesList";
import Notifications from "./pages/Notifications";
// legacy Login/Register page files kept for reference but routes use the new Figma AuthForms
import { AuthForms } from "./components/figma/AuthForms";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailSent from "./pages/VerifyEmailSent";
import Forbidden from "./pages/Forbidden";
import ProfilePage from "./pages/ProfilePage";
import StudentDashboard from "./pages/StudentDashboard";
import DashboardRedirect from "./pages/DashboardRedirect";
import TeacherDashboard from "./pages/TeacherDashboard";
import StakingPage from "./pages/teacher/Staking";
import AdminDashboard from "./pages/AdminDashboard";
import ApproveCourses from "./pages/admin/ApproveCourses";
import CoursesStudioList from "./pages/studio/CoursesStudioList"
import CourseStudioForm from "./pages/studio/CourseStudioForm"
import CourseBuilder from "./pages/studio/CourseBuilder"
import { useParams } from "react-router-dom";
import WalletPage from "./pages/WalletPage";
import PendingDiscountsPage from "./features/discounts/pages/PendingDiscountsPage";
import DropdownSmoke from "./pages/_smoke/DropdownSmoke";

function BuyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/courses/${id}/checkout`} replace />;
}

export default function App() {
  const { isAuthenticated, booting, authChecked } = useAuth();

  return (
    <>
      <TopProgressBar />
      <ToastHost />

      <Routes>
        {/* Auth routes - render without AppLayout (no navbar/spacer) */}
  <Route path="/login" element={<ErrorBoundary><AuthForms defaultTab="login" /></ErrorBoundary>} />
  <Route path="/register" element={<ErrorBoundary><AuthForms defaultTab="signup" /></ErrorBoundary>} />
        <Route path="/verify-email" element={<ErrorBoundary><VerifyEmail /></ErrorBoundary>} />
        <Route path="/verify-email/sent" element={<ErrorBoundary><VerifyEmailSent /></ErrorBoundary>} />

        <Route element={<AppLayoutRoute />}>
          {/* Public */}
          <Route
            index
            element={
              !authChecked || booting ? (
                  <div className="p-6 text-sm text-muted-foreground">Verifica sessione</div>
                ) : isAuthenticated ? (
                  <Navigate to="/courses" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
            }
          />
          <Route path="/forbidden" element={<ErrorBoundary><Forbidden /></ErrorBoundary>} />
          <Route path="/courses" element={<ErrorBoundary><CoursesList /></ErrorBoundary>} />
          <Route path="/_smoke/dropdown" element={<ErrorBoundary><DropdownSmoke /></ErrorBoundary>} />
          <Route path="/courses/:id" element={<ErrorBoundary><CourseDetail /></ErrorBoundary>} />

          <Route
            path="/learn/:id"
            element={
              <ProtectedRoute>
                <ErrorBoundary><StudentCourse /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my/exercises"
            element={
              <ProtectedRoute>
                <ErrorBoundary><MyExercises /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exercises/:id/submit"
            element={
              <ProtectedRoute>
                <ErrorBoundary><ExerciseSubmit /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/lessons/:id"
            element={
              <ProtectedRoute>
                <ErrorBoundary><LessonPage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:id/checkout"
            element={
              <ProtectedRoute>
                <ErrorBoundary><CourseCheckout /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route path="/courses/:id/buy" element={<BuyRedirect />} />
          <Route path="/payments/return" element={<ErrorBoundary><PaymentReturn /></ErrorBoundary>} />

          {/* Protected (any role) */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <ErrorBoundary><Notifications /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/assigned"
            element={
              <ProtectedRoute>
                <ErrorBoundary><ReviewsAssigned /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/:id/review"
            element={
              <ProtectedRoute>
                <ErrorBoundary><ReviewSubmission /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/history"
            element={
              <ProtectedRoute>
                <ErrorBoundary><ReviewsHistory /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary><ProfilePage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
           <Route
             path="/dashboard/student"
             element={
               <ProtectedRoute>
                 <ErrorBoundary><StudentDashboard /></ErrorBoundary>
               </ProtectedRoute>
             }
           />

          {/* Peer Review pages */}
          <Route
            path="/peer-review"
            element={
              <ProtectedRoute>
                <ErrorBoundary><PeerReview /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/peer-review"
            element={
              <ProtectedRoute>
                <ErrorBoundary><PeerReview /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Community / Gallery / Discussions / Achievements */}
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <ErrorBoundary><Community /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <ErrorBoundary><Gallery /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/discussions"
            element={
              <ProtectedRoute>
                <ErrorBoundary><Discussions /></ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <ErrorBoundary><Achievements /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* ADMIN only */}
          <Route
            path="/admin"
            element={
              <RoleRoute allow="admin">
                <ErrorBoundary><AdminDashboard /></ErrorBoundary>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/approve-courses"
            element={
              <RoleRoute allow="admin">
                <ErrorBoundary><ApproveCourses /></ErrorBoundary>
              </RoleRoute>
            }
          />

          {/* TEACHER only */}
          <Route
            path="/teacher"
            element={
              <RoleRoute allow="teacher">
                <ErrorBoundary><TeacherDashboard /></ErrorBoundary>
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/staking"
            element={
              <RoleRoute allow="teacher">
                <ErrorBoundary><StakingPage /></ErrorBoundary>
              </RoleRoute>
            }
          />

          <Route
            path="/teacher/pending-discounts"
            element={
              <RoleRoute allow="teacher">
                <ErrorBoundary><PendingDiscountsPage /></ErrorBoundary>
              </RoleRoute>
            }
          />

          {/* /teacher/choices removed - use sidebar decision panel instead */}

          {/* Studio (teacher) */}
          <Route path="studio/courses" element={<ProtectedRoute><ErrorBoundary><CoursesStudioList /></ErrorBoundary></ProtectedRoute>} />
          <Route path="studio/courses/new" element={<ProtectedRoute><ErrorBoundary><CourseStudioForm /></ErrorBoundary></ProtectedRoute>} />
          <Route path="studio/courses/:id/edit" element={<ProtectedRoute><ErrorBoundary><CourseStudioForm /></ErrorBoundary></ProtectedRoute>} />
          <Route path="studio/courses/:id/builder" element={<ProtectedRoute><ErrorBoundary><CourseBuilder /></ErrorBoundary></ProtectedRoute>} />

          {/* Wallet */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <ErrorBoundary><WalletPage /></ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* 404: decide after authChecked to avoid redirect races */}
          <Route
            path="*"
            element={<ConditionalFallback />}
          />
        </Route>
      </Routes>
    </>
  );
}

function ConditionalFallback() {
  const { authChecked, isAuthenticated, booting } = useAuth();
  if (!authChecked || booting) return <div className="p-6 text-sm text-muted-foreground">Verifica sessione</div>;
  return isAuthenticated ? <Navigate to="/courses" replace /> : <Navigate to="/login" replace />;
}
