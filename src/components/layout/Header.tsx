import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Search,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Menu,
  GraduationCap,
} from 'lucide-react';
import { UserAccount, Student } from '../../types/school.ts';
import { DEMO_USERS } from '../../data/mockData.ts';
import { StarAILogo } from '../common/StarAILogo.tsx';
import { filterStudentsFast } from '../../utils/schoolMath.ts';

interface HeaderProps {
  currentUser: UserAccount;
  students: Student[];
  onSelectUser: (user: UserAccount) => void;
  onInspectStudent: (student: Student) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAI: () => void;
  onResetData: () => void;
  onOpenWelcomeScreen?: () => void;
  onToggleMobileMenu?: () => void;
  isLoadingData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  students,
  onSelectUser,
  onInspectStudent,
  isDarkMode,
  onToggleDarkMode,
  onOpenAI,
  onResetData,
  onOpenWelcomeScreen,
  onToggleMobileMenu,
  isLoadingData = false,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const matchingStudents =
    searchQuery.trim().length > 0 ? filterStudentsFast(students, searchQuery).slice(0, 6) : [];

  return (
    <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Zone 1: Brand title & Academic session */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="p-2 lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenWelcomeScreen?.()}
          title="Return to STAR AI Open Screen"
          className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity"
        >
          <StarAILogo size={36} className="shrink-0 drop-shadow-xs" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                STAR <span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/50">
                ERP
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              AY 2026–2027 · Term II
            </p>
          </div>
        </button>
      </div>

      {/* Zone 2: Live Instant Student Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Quick lookup: student name, roll no (10A-01), parent phone..."
            aria-label="Quick student lookup"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/40"
          />
        </div>

        {searchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {matchingStudents.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-500">
                No students matching "{searchQuery}"
              </div>
            ) : (
              matchingStudents.map(stu => (
                <button
                  key={stu.id}
                  type="button"
                  onMouseDown={() => {
                    onInspectStudent(stu);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {stu.firstName.charAt(0)}
                      {stu.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {stu.firstName} {stu.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {stu.classGrade}-{stu.section} · Roll {stu.rollNo} · Parent: {stu.parentName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {stu.attendanceRate}%
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Role Switching */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Reset Database Button */}
        <button
          type="button"
          onClick={onResetData}
          disabled={isLoadingData}
          title="Reset database to initial pristine school records"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline text-xs font-medium">Reset Data</span>
        </button>

        {/* Quick AI Intelligence Launcher */}
        <button
          type="button"
          onClick={onOpenAI}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="whitespace-nowrap">AI Intelligence</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label="Toggle color theme"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium capitalize">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Profile</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                  Switch roles below to test role permissions:
                </p>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto">
                {DEMO_USERS.map(user => {
                  const isActive = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        onSelectUser(user);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {onOpenWelcomeScreen && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuOpen(false);
                      onOpenWelcomeScreen();
                    }}
                    className="w-full text-center px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    Return to Open Screen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
