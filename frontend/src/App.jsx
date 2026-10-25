import { Navigate, Route, Routes } from "react-router-dom";
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/auth/ProtectedRoute";
import Button from "./components/common/Button";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";
import ChatPage from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentPage";

function TempAppPage() {
  const { user, logout } = useAuth();
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="text-sm text-slate-500">Signed in as</p>
        <p className="mt-1 font-medium">{user?.email ?? user?.name}</p>
        <Button variant="secondary" className="mt-6" onClick={logout}>
          Log out
        </Button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<ChatPage />} />
          <Route path="/app/documents" element={<DocumentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
