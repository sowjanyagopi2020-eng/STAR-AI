import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users2,
  CalendarCheck2,
  BookOpenCheck,
  Award,
  Wallet,
  Bus,
  Library,
  Building2,
  Megaphone,
  Sparkles,
  UserCheck,
  User,
  Globe,
  FileBadge,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../../types/school.ts';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'staff'
  | 'attendance'
  | 'academics'
  | 'examinations'
  | 'fees'
  | 'transport'
  | 'library'
  | 'hostel'
  | 'communication'
  | 'ai_center'
  | 'parent_portal'
  | 'student_portal'
  | 'website'
  | 'certificates_visitors'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
  badge?: string;
  section: 'core' | 'academics' | 'operations' | 'portals' | 'ai';
}

const NAV_ITEMS: NavItem[] = [
  // Core
  { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, section: 'core' },
  { id: 'students', label: 'Student Directory', icon: GraduationCap, section: 'core' },
  { id: 'staff', label: 'Faculty & Staff', icon: Users2, section: 'core' },
  { id: 'attendance', label: 'Attendance Roster', icon: CalendarCheck2, section: 'core' },

  // Academics
  { id: 'academics', label: 'Curriculum & Timetable', icon: BookOpenCheck, section: 'academics' },
  { id: 'examinations', label: 'Examinations & Marks', icon: Award, section: 'academics' },

  // Operations
  { id: 'fees', label: 'Fees & Accounting', icon: Wallet, section: 'operations' },
  { id: 'transport', label: 'Transport & GPS Fleet', icon: Bus, section: 'operations' },
  { id: 'library', label: 'Library Management', icon: Library, section: 'operations' },
  { id: 'hostel', label: 'Hostel Accommodation', icon: Building2, section: 'operations' },
  { id: 'communication', label: 'Circulars & Alerts', icon: Megaphone, section: 'operations' },
  { id: 'certificates_visitors', label: 'Visitors & Gate Passes', icon: FileBadge, section: 'operations' },
  { id: 'reports', label: 'Reports & Export', icon: BarChart3, section: 'operations' },

  // Portals
  { id: 'parent_portal', label: 'Parent Portal', icon: UserCheck, section: 'portals' },
  { id: 'student_portal', label: 'Student Portal', icon: User, section: 'portals' },
  { id: 'website', label: 'Public School Website', icon: Globe, section: 'portals' },

  // AI Center
  { id: 'ai_center', label: 'AI Intelligence Center', icon: Sparkles, section: 'ai', badge: 'Gemini' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Determine if user has access to this tab
  const canAccessTab = (item: NavItem): boolean => {
    // Super admin and school admin have access to everything
    if (userRole === 'super_admin' || userRole === 'school_admin' || userRole === 'principal') return true;

    if (userRole === 'teacher') {
      return ['dashboard', 'students', 'attendance', 'academics', 'examinations', 'communication', 'library', 'ai_center', 'student_portal'].includes(item.id);
    }
    if (userRole === 'student') {
      return ['student_portal', 'academics', 'library', 'ai_center', 'communication', 'website'].includes(item.id);
    }
    if (userRole === 'parent') {
      return ['parent_portal', 'transport', 'communication', 'ai_center', 'website'].includes(item.id);
    }
    if (userRole === 'accountant') {
      return ['dashboard', 'fees', 'students', 'reports', 'ai_center'].includes(item.id);
    }
    if (userRole === 'librarian') {
      return ['library', 'students', 'reports', 'ai_center'].includes(item.id);
    }
    if (userRole === 'transport_manager') {
      return ['transport', 'students', 'reports', 'ai_center'].includes(item.id);
    }
    if (userRole === 'hr_manager') {
      return ['staff', 'reports', 'communication', 'ai_center'].includes(item.id);
    }
    if (userRole === 'receptionist') {
      return ['certificates_visitors', 'students', 'communication', 'website', 'ai_center'].includes(item.id);
    }
    if (userRole === 'vice_principal') {
      return ['dashboard', 'students', 'staff', 'attendance', 'academics', 'examinations', 'communication', 'reports', 'ai_center'].includes(item.id);
    }

    return true;
  };

  const visibleItems = NAV_ITEMS.filter(canAccessTab);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-40 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-6">
          {/* Section: AI Flagship Spotlight */}
          <div>
            <button
              onClick={() => {
                onSelectTab('ai_center');
                onCloseMobile();
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                currentTab === 'ai_center'
                  ? 'bg-linear-to-r from-blue-700 to-indigo-700 text-white border-blue-500 shadow-md shadow-blue-900/30 font-semibold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    AI Intelligence
                    <span className="text-[9px] font-semibold bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded">
                      Gemini
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">School Copilot & Insights</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Section: Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Modules
            </p>
            {visibleItems
              .filter(item => item.id !== 'ai_center')
              .map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Role Access</span>
            <span className="font-semibold text-slate-300 capitalize">{userRole.replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">STAR AI v2.4 Enterprise</p>
        </div>
      </aside>
    </>
  );
};
