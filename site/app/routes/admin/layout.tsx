import React from "react";
import {Outlet, useNavigate, useLocation} from "react-router";
import {motion} from "motion/react";
import {toast} from "sonner";
import {useAuth} from "~/lib/auth";
import {Container} from "~/components/ui/container";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {LogOut, Settings, FileText} from "lucide-react";

export default function AdminLayout() {
  const {user, loading, logout, isAdmin} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user && location.pathname !== "/admin/login") {
    navigate("/admin/login");
    return null;
  }

  // Show access denied if not admin
  if (user && !isAdmin && location.pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container size="sm">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have permission to access the admin panel.
            </p>
            <Button onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Outlet />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");

      // Show success toast in development
      if (import.meta.env.DEV) {
        toast.success("Logged Out", {
          description: "You have been successfully logged out.",
        });
      }
    } catch (error: any) {
      console.error("Error logging out:", error);

      // Show error toast in development
      if (import.meta.env.DEV) {
        toast.error("Logout Failed", {
          description: error.message || "An error occurred while logging out.",
          action: {
            label: "Retry",
            onClick: handleLogout,
          },
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <motion.header
        initial={{y: -20, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        transition={{duration: 0.4}}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Container className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold">WGU Extension Admin</h1>
                <p className="text-sm text-muted-foreground">
                  Logged in as {user.email}
                </p>
              </div>
              <nav className="flex items-center gap-2">
                <Button
                  variant={location.pathname === "/admin" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/admin")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={location.pathname === "/admin/suggestions" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/admin/suggestions")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Suggestions
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                View Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </Container>
      </motion.header>

      {/* Admin Content */}
      <main className="py-8">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
