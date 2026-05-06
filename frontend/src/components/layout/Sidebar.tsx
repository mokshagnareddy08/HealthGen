import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Utensils, Dumbbell, UserCircle, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../services/utils";
import { Button } from "../ui/Button";
import { getInitialProfile } from "../../services/profileStorage";

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const activeProfile = getInitialProfile(user);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Utensils, label: "Meal Plan", path: "/meals" },
    { icon: Dumbbell, label: "Workouts", path: "/workouts" },
    { icon: UserCircle, label: "Profiles", path: "/profile" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-transparent">
      <aside className="w-72 hidden lg:flex flex-col m-4 mr-0 rounded-[30px] border border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_25px_60px_-25px_rgba(244,114,182,0.35)]">
        <div className="p-6 border-b border-rose-100/80">
          <div className="flex items-center gap-3">
            <img src="/healthgen-logo.png" alt="HealthGen logo" className="w-11 h-11 rounded-2xl object-cover shadow-md" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">HealthGen</span>
              <p className="text-xs text-slate-500">Smart meals & workouts</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="mt-5 w-full rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-sky-50 hover:shadow-md px-4 py-4 text-left transition-all"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-bold">Active profile</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{activeProfile.name || 'Complete profile'}</p>
                <p className="text-sm text-slate-500">{activeProfile.relation || user?.email || 'Switch user'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-rose-100 via-white to-sky-100 text-slate-900 shadow-md border border-white/80'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 border border-transparent'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-100/80 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/75 backdrop-blur-xl border-b border-white/70 flex lg:hidden items-center px-4 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img src="/healthgen-logo.png" alt="HealthGen logo" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-bold text-slate-900">HealthGen</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <UserCircle className="w-6 h-6" />
          </Button>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
