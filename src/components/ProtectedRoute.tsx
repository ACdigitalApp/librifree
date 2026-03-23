import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/accedi" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/biblioteca" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
