import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";

export function AuthLoadingScreen() {
  return (
    <div
      className="grid min-h-dvh place-items-center text-indigo-600"
      role="status"
      aria-label="Loading"
    >
      <LoadingSpinner className="size-6" />
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthLoadingScreen />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthLoadingScreen />;
  if (status === "authenticated") {
    return <Navigate to={location.state?.from?.pathname ?? "/app"} replace />;
  }
  return <Outlet />;
}
