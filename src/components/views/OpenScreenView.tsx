import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Download,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
  ChevronDown,
} from 'lucide-react';
import starAiLogoImg from '../../assets/images/star_ai_logo_1794898373999.jpg';
import { DEMO_USERS } from '../../data/mockData.ts';
import { UserAccount } from '../../types/school.ts';
import { StarAILogo } from '../common/StarAILogo.tsx';

interface OpenScreenViewProps {
  onEnterAsUser: (user: UserAccount) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const FEATURED_ROLES: Array<{
  role: UserAccount['role'];
  label: string;
  subtitle: string;
  badge: string;
  accent: string;
  icon: React.ReactNode;
}> = [
  {
    role: 'teacher',
    label: 'Teacher Portal',
    subtitle: 'Fast Attendance, Student Info & Messaging',
    badge: 'Fast Roll Call',
    accent: 'from-blue-600 to-indigo-700',
    icon: <CalendarCheck className="w-5 h-5 text-white" />,
  },
  {
    role: 'student',
    label: 'Student Portal',
    subtitle: 'Schedule, Attendance, Inbox & Study Buddy',
    badge: 'Student Access',
    accent: 'from-sky-500 to-blue-700',
    icon: <GraduationCap className="w-5 h-5 text-white" />,
  },
  {
    role: 'principal',
    label: 'Principal & Admin',
    subtitle: 'Campus Analytics, AI Copilot & Directory',
    badge: 'Executive ERP',
    accent: 'from-slate-800 to-blue-900',
    icon: <ShieldCheck className="w-5 h-5 text-amber-300" />,
  },
  {
    role: 'parent',
    label: 'Parent Portal',
    subtitle: 'Attendance Alerts, Marks, Fees & Bus GPS',
    badge: 'Family Link',
    accent: 'from-amber-500 to-amber-600',
    icon: <Users className="w-5 h-5 text-slate-950" />,
  },
];

export const OpenScreenView: React.FC<OpenScreenViewProps> = ({
  onEnterAsUser,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [selectedOtherRoleId, setSelectedOtherRoleId] = useState<string>('u-1');
  const [showMoreRoles, setShowMoreRoles] = useState(false);

  const featuredUsers = FEATURED_ROLES.map(item => ({
    ...item,
    user: DEMO_USERS.find(u => u.role === item.role) || DEMO_USERS[0],
  }));

  const otherRoles = DEMO_USERS.filter(
    u => !['teacher', 'student', 'principal', 'parent'].includes(u.role)
  );
  const selectedOtherUser =
    otherRoles.find(u => u.id === selectedOtherRoleId) || otherRoles[0] || DEMO_USERS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col">
      {/* Subtle architectural navy & royal blue radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,78,216,0.28),transparent_48%),radial-gradient(circle_at_85%_75%,rgba(245,158,11,0.14),transparent_45%)]"
      />

      {/* Minimal Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <StarAILogo size={36} className="shrink-0" />
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white">
              STAR <span className="text-amber-400">AI</span>
            </span>
            <p className="text-[10px] text-blue-200/80">AY 2026–2027 · Campus ERP</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={starAiLogoImg}
            download="STAR_AI_Logo.jpg"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-blue-100 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Download Logo</span>
          </a>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Centered Open Screen Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left: Official STAR AI Logo & Brand Identity */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="relative group">
            <div className="absolute -inset-3 rounded-3xl bg-linear-to-tr from-blue-600/40 via-amber-400/30 to-indigo-600/40 blur-xl opacity-80" />
            <div className="relative p-2.5 rounded-3xl bg-slate-900/90 border-2 border-amber-400/60 shadow-2xl">
              <StarAILogo size={136} className="rounded-2xl" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-sm sm:text-base font-semibold text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>AI-Powered School Management System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              STAR <span className="text-amber-400">AI</span>
            </h1>

            <p className="text-base sm:text-lg font-medium text-blue-100">
              “One School. One Platform. Complete Intelligence.”
            </p>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Built for fast daily classroom roll call, instant teacher–student–parent communication, complete student records, and Gemini-powered academic intelligence.
            </p>
          </div>

          {/* 3 Focused Capability Highlights */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-lg pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
              <CalendarCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Fast Attendance</p>
              <p className="text-[11px] text-slate-400">Roll / QR & alerts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
              <MessageSquare className="w-4 h-4 text-sky-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Direct Messaging</p>
              <p className="text-[11px] text-slate-400">Teacher & student chat</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
              <Sparkles className="w-4 h-4 text-amber-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Gemini AI</p>
              <p className="text-[11px] text-slate-400">Instant Q&A & insights</p>
            </div>
          </div>
        </div>

        {/* Right: Fast 1-Click Portal Launchpad */}
        <div className="lg:col-span-6 w-full">
          <div className="p-6 sm:p-7 rounded-2xl bg-white text-slate-900 dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Open Your School Portal</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose a workspace below for instant 1-click access
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                12 Roles Ready
              </span>
            </div>

            {/* Primary 4 Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredUsers.map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => onEnterAsUser(item.user)}
                  className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-left transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl bg-linear-to-br ${item.accent} flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.label}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1.5">
                      Signed in as {item.user.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Other Institutional Staff Roles */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowMoreRoles(v => !v)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1"
              >
                <span>Administration & Department Staff Login ({otherRoles.length} roles)</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showMoreRoles ? 'rotate-180' : ''}`}
                />
              </button>

              {showMoreRoles && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <select
                    aria-label="Select department staff role"
                    value={selectedOtherRoleId}
                    onChange={e => setSelectedOtherRoleId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {otherRoles.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onEnterAsUser(selectedOtherUser)}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onEnterAsUser(DEMO_USERS[2])}
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Enter STAR AI Campus Dashboard</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
