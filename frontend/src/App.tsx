import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { ROUTES } from "./routes/paths";

const LoginPage = React.lazy(() => import("./pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })));
const TeacherDashboardPage = React.lazy(() =>
  import("./pages/teacher/TeacherDashboardPage").then((m) => ({
    default: m.TeacherDashboardPage
  }))
);
const TeacherStudyMaterialsPage = React.lazy(() =>
  import("./pages/teacher/StudyMaterialsPage").then((m) => ({
    default: m.TeacherStudyMaterialsPage
  }))
);
const TeacherPeerSessionsPage = React.lazy(() =>
  import("./pages/teacher/PeerSessionsPage").then((m) => ({
    default: m.TeacherPeerSessionsPage
  }))
);
const TeacherAssignmentsPage = React.lazy(() =>
  import("./pages/teacher/AssignmentsPage").then((m) => ({
    default: m.TeacherAssignmentsPage
  }))
);
const StudentDashboardPage = React.lazy(() =>
  import("./pages/student/StudentDashboardPage").then((m) => ({
    default: m.StudentDashboardPage
  }))
);
const StudentStudyMaterialsPage = React.lazy(() =>
  import("./pages/student/StudyMaterialsPage").then((m) => ({
    default: m.StudentStudyMaterialsPage
  }))
);
const StudentPeerSessionsPage = React.lazy(() =>
  import("./pages/student/PeerSessionsPage").then((m) => ({
    default: m.StudentPeerSessionsPage
  }))
);
const StudentAssignmentsPage = React.lazy(() =>
  import("./pages/student/AssignmentsPage").then((m) => ({
    default: m.StudentAssignmentsPage
  }))
);
const DoubtDiscussionPage = React.lazy(() =>
  import("./pages/shared/DoubtDiscussionPage2").then((m) => ({
    default: m.DoubtDiscussionPage2
  }))
);

const FullscreenLoader: React.FC = () => (
  <div className="page-shell flex items-center justify-center">
    <div className="glass-surface px-10 py-8 rounded-3xl flex flex-col items-center gap-4">
      <div className="h-10 w-10 rounded-full border-2 border-slate-600 border-t-primary animate-spin" />
      <p className="text-sm text-slate-300">
        Initializing your CollabClass workspace...
      </p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  allowedRoles?: Array<"student" | "teacher" | "admin">;
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to={ROUTES.login} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "teacher" ? ROUTES.teacherRoot : ROUTES.studentRoot;
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export const App: React.FC = () => {
  const { user } = useAuth();

  const defaultAuthedRoute =
    user?.role === "teacher"
      ? ROUTES.teacherDashboard
      : user?.role === "student"
      ? ROUTES.studentDashboard
      : ROUTES.login;

  return (
    <Suspense fallback={<FullscreenLoader />}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={defaultAuthedRoute} replace />}
        />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />

        <Route
          path={ROUTES.teacherRoot}
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AppLayout role="teacher" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="assignments" element={<TeacherAssignmentsPage />} />
          <Route path="doubts" element={<DoubtDiscussionPage />} />
          <Route path="study-materials" element={<TeacherStudyMaterialsPage />} />
          <Route path="peer-sessions" element={<TeacherPeerSessionsPage />} />
        </Route>

        <Route
          path={ROUTES.studentRoot}
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <AppLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="doubts" element={<DoubtDiscussionPage />} />
          <Route path="study-materials" element={<StudentStudyMaterialsPage />} />
          <Route path="peer-sessions" element={<StudentPeerSessionsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={defaultAuthedRoute} replace />} />
      </Routes>
    </Suspense>
  );
};

