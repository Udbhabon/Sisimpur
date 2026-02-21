import { Outlet } from "react-router-dom";
// DEV ONLY: auth bypass — revert before production
// import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute() {
  // DEV ONLY: skip auth check — revert before production
  return <Outlet />;

  // --- ORIGINAL CODE (restore below to re-enable auth) ---
  // const { isAuthenticated, isLoading } = useAuth();
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
  //       <i className="ri-loader-4-line animate-spin text-4xl text-white/30" />
  //     </div>
  //   );
  // }
  // if (!isAuthenticated) {
  //   return <Navigate to="/signin" replace />;
  // }
  // return <Outlet />;
}
