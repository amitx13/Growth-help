import { Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";
import { Spinner } from "@repo/ui";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-12 text-primary" />
    </div>
  )

  if (!user) return (
  <Navigate to="/login" replace />
  )

  return children;
}
