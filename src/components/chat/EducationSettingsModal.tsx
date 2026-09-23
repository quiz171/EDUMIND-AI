import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  GraduationCap,
  BookOpen,
  Check,
  Volume2,
  Mic,
  Shield,
  LogOut,
  Building,
  Sparkles,
  Award,
  Sliders,
  Cpu,
  Camera,
  Palette,
  Sun,
  Moon,
  Flame,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { User, RagDocument } from '../../types';
import { BACKGROUND_THEMES, THEME_CATEGORIES, BackgroundTheme } from '../../lib/theme';

interface EducationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout?: () => void;
  currentThemeId?: string;
  onSelectTheme?: (themeId: string) => void;
  sessionsCount?: number;
  activeDoc?: RagDocument | null;
  defaultTab?: 'profile' | 'academic' | 'model' | 'appearance' | 'preferences' | 'account';
}

export const EDUCATION_LEVELS = [
  {
    id: 'University',
    name: 'University / Polytechnic',
    subtitle: 'Undergraduate, 6-Yr Clinical & Postgrad',
    years: [
      '100L / Year 1',
      '200L / Year 2',
      '300L / Year 3',
      '400L / Year 4',
      '500L / Year 5 (5-Year Final / Clinical 1)',
      '600L / Year 6 (Final Year MBBS / Vet Med / PharmD / BDS)',
      'Postgraduate / Masters',
      'PhD / Doctorate',
    ],
    defaultCourse: 'Computer Science',
  },
  {
    id: 'SSS',
    name: 'Senior Secondary',
    subtitle: 'SS1–SS3, WAEC, NECO & JAMB Prep',
    years: ['SS1', 'SS2', 'SS3', 'JAMB Candidate', 'WAEC / NECO / GCE Candidate'],
    defaultCourse: 'Science (Physics, Chem, Bio, Math)',
  },
  {
    id: 'JSS',
    name: 'Junior Secondary',
    subtitle: 'JSS 1–3, BECE & Junior WAEC',
    years: ['JSS 1', 'JSS 2', 'JSS 3'],
    defaultCourse: 'Basic Science & Mathematics',
  },
  {
    id: 'Primary',
    name: 'Primary / Elementary',
    subtitle: 'Primary 1–6 & Foundational Phonics',
    years: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    defaultCourse: 'Basic Science & Math',
  },
];

const PRESET_COURSES = [
  { name: 'Medicine & Surgery (MBBS - 6 Yrs)', isSixYear: true },
  { name: 'Veterinary Medicine (DVM - 6 Yrs)', isSixYear: true },
  { name: 'Pharmacy (PharmD - 6 Yrs)', isSixYear: true },
  { name: 'Dentistry (BDS - 6 Yrs)', isSixYear: true },
  { name: 'Nursing Science (5 Yrs)', isSixYear: false },
  { name: 'Law (LL.B - 5 Yrs)', isSixYear: false },
  { name: 'Computer Science / Software Eng', isSixYear: false },
  { name: 'Electrical / Mechanical Engineering', isSixYear: false },
  { name: 'Accounting / Economics / Finance', isSixYear: false },
];

export const EducationSettingsModal: React.FC<EducationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  currentThemeId = 'obsidian',
  onSelectTheme,
  sessionsCount = 0,
  activeDoc = null,
  defaultTab = 'profile',
}) => {
  const [activeNav, setActiveNav] = useState<'profile' | 'academic' | 'model' | 'appearance' | 'preferences' | 'account'>(defaultTab);
  const [selectedLevel, setSelectedLevel] = useState<string>(currentUser.educationLevel || 'University');
  const [selectedYear, setSelectedYear] = useState<string>(currentUser.classYear || '100L / Year 1');
  const [course, setCourse] = useState<string>(currentUser.course || 'Computer Science');
  const [fullName, setFullName] = useState<string>(currentUser.fullName || '');
  const [school, setSchool] = useState<string>(currentUser.school || '');
  const [targetExam, setTargetExam] = useState<string>(currentUser.targetExam || 'Semester Exams');
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow' | 'fast'>('normal');
  const [enableVoiceTutor, setEnableVoiceTutor] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [appearanceCategory, setAppearanceCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen && currentUser) {
      setSelectedLevel(currentUser.educationLevel || 'University');
      setSelectedYear(currentUser.classYear || '100L / Year 1');
      setCourse(currentUser.course || 'Computer Science');
      setFullName(currentUser.fullName || '');
      setSchool(currentUser.school || '');
      setTargetExam(currentUser.targetExam || 'Semester Exams');
      setActiveNav(defaultTab);
    }
  }, [isOpen, currentUser, defaultTab]);

  if (!isOpen) return null;

  const currentLevelConfig =
    EDUCATION_LEVELS.find((l) => l.id.toLowerCase() === selectedLevel.toLowerCase()) ||
    EDUCATION_LEVELS[0];

  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId);
    const targetConfig = EDUCATION_LEVELS.find((l) => l.id === levelId) || EDUCATION_LEVELS[0];
    setSelectedYear(targetConfig.years[0]);
    if (!course || course === 'General' || course === 'Computer Science' || course === 'Basic Science & Math') {
      setCourse(targetConfig.defaultCourse);
    }
  };

  const handleSave = () => {
    const updated: User = {
      ...currentUser,
      fullName: fullName.trim() || currentUser.fullName,
      educationLevel: selectedLevel,
      classYear: selectedYear,
      course: course.trim() || currentLevelConfig.defaultCourse,
      school: school.trim() || currentUser.school,
      targetExam: targetExam.trim() || currentUser.targetExam,
    };

    onUpdateUser(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 450);
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[90dvh] sm:h-[620px] text-stone-200">
        {/* Clean Minimal Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#111] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight">Settings</h2>
              <p className="text-xs text-stone-400">Manage student profile, academic stage, theme & model preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Split-View / Mobile Stack */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Navigation Rail */}
          <nav className="sm:w-56 shrink-0 bg-[#0f0f0f] border-b sm:border-b-0 sm:border-r border-white/10 p-2 sm:p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible shrink-0 scrollbar-none">
            {[
              { id: 'profile', label: 'Student Profile', icon: UserIcon },
              { id: 'academic', label: 'Education & Stage', icon: GraduationCap },
              { id: 'model', label: 'AI & Exam Vision', icon: Cpu },
              { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
              { id: 'preferences', label: 'Voice & Audio', icon: Volume2 },
              { id: 'account', label: 'Account & Sign Out', icon: Shield },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id as any)}
                  className={`flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer w-full text-left ${
                    isActive
                      ? 'bg-white/10 text-white font-bold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Main Content Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0 bg-[#141414] overscroll-contain space-y-6">
            {/* Student Profile Tab */}
            {activeNav === 'profile' && (
              <div className="space-y-5 max-w-xl">
                {/* Avatar & Core Identity Card */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                    {getInitials(fullName || currentUser.fullName)}
                  </div>

                  <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {fullName || currentUser.fullName || 'Student'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {selectedLevel || currentUser.educationLevel || 'Active Student'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                      <span className="truncate">{currentUser.email}</span>
                    </p>
                    <p className="text-xs text-stone-300">
                      <strong className="text-white">{selectedYear || currentUser.classYear}</strong> •{' '}
                      {course || currentUser.course}
                    </p>
                  </div>
                </div>

                {/* Profile Edit Fields */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Profile Details</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300">Student Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Student Name"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300">Email Address</label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-stone-400">
                      <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                      <span className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Class / Year</label>
                      <input
                        type="text"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        placeholder="e.g. 600L, SS3, Year 1"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Course / Major</label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="e.g. Medicine & Surgery, Science"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Learning & Academic Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                      <Flame className="w-4 h-4 shrink-0" />
                      <span>Study Streak</span>
                    </div>
                    <p className="text-lg font-bold text-white">1 Day</p>
                    <p className="text-[10px] text-stone-400">Keep learning daily</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Study Sessions</span>
                    </div>
                    <p className="text-lg font-bold text-white">{sessionsCount}</p>
                    <p className="text-[10px] text-stone-400">Archived chats</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Grounded Notes</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {activeDoc ? activeDoc.fileName : 'None attached'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {activeDoc ? `${activeDoc.chunksCount} chunks indexed` : 'Upload PDF in chat'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Academic & Stage Tab */}
            {activeNav === 'academic' && (
              <div className="space-y-5 max-w-xl">
                {/* Education Stage Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">Education Stage</label>
                    <span className="text-[11px] font-mono text-emerald-400">{selectedLevel}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EDUCATION_LEVELS.map((lvl) => {
                      const isSelected = selectedLevel.toLowerCase() === lvl.id.toLowerCase();
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleLevelChange(lvl.id)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/60 text-white ring-1 ring-emerald-500/30'
                              : 'bg-white/[0.02] border-white/10 text-stone-300 hover:bg-white/[0.05] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-xs text-white">{lvl.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] text-stone-400 leading-snug">{lvl.subtitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Class / Year Level */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">Class & Year</label>
                    {selectedLevel === 'University' && (
                      <span className="text-[11px] text-emerald-400">Up to 600L (Final Year Clinical)</span>
                    )}
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {currentLevelConfig.years.map((yr) => (
                      <option key={yr} value={yr} className="bg-[#1c1c1c] text-white py-1">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course / Focus Area */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-300">Course / Major / Subject Focus</label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. Medicine & Surgery (MBBS), Computer Science, Law"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Preset Pills */}
                  {selectedLevel === 'University' && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-stone-400 font-medium">Quick suggestions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COURSES.map((pc) => (
                          <button
                            key={pc.name}
                            type="button"
                            onClick={() => {
                              setCourse(pc.name);
                              if (pc.isSixYear) {
                                setSelectedYear('600L / Year 6 (Final Year MBBS / Vet Med / PharmD / BDS)');
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              course === pc.name
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                                : 'bg-white/5 border-white/10 text-stone-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {pc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* School / Institution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">Institution / University (Optional)</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. University of Ibadan, UNILAG, ABU Zaria, UNN"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI & Exam Vision Tab */}
            {activeNav === 'model' && (
              <div className="space-y-5 max-w-xl">
                {/* Active AI Engine */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">EduMind Academic AI Engine</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Multimodal AI tuned for Nigerian curricula, university degree programs, WAEC marking schemes, and clinical case drills.
                  </p>
                </div>

                {/* Past Question Photo Solving Card */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <Camera className="w-4 h-4" />
                    <span>Exam Past Question Vision</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Snap or upload past question papers, diagrams, and handwritten equations directly in chat. EduMind Brain extracts the text, identifies the concepts, and generates step-by-step working.
                  </p>
                </div>

                {/* Target Examination */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300">Exam Target Focus</label>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. University Semester Exams, WAEC 2025, JAMB UTME, Post-UTME, MBBS"
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-stone-400">
                    EduMind adapts its solution structure, grading style, and terminology to match your target exam board.
                  </p>
                </div>
              </div>
            )}

            {/* Appearance & Theme Tab */}
            {activeNav === 'appearance' && (
              <div className="space-y-5 max-w-xl">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Captivating Themes & Atmosphere</span>
                    </h3>
                    <span className="text-[11px] font-mono text-stone-400">
                      {BACKGROUND_THEMES.length} Environments
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Transform your entire study environment into an immersive, high-contrast, eye-safe space.
                  </p>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {THEME_CATEGORIES.map((cat) => {
                    const isCatActive = appearanceCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setAppearanceCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          isCatActive
                            ? 'bg-white/15 text-white font-semibold border border-white/20'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(appearanceCategory === 'all'
                    ? BACKGROUND_THEMES
                    : BACKGROUND_THEMES.filter((t) => t.category === appearanceCategory)
                  ).map((theme: BackgroundTheme) => {
                    const isSelected = currentThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          if (onSelectTheme) onSelectTheme(theme.id);
                        }}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                          isSelected
                            ? 'border-white/40 bg-white/[0.06] ring-1 ring-white/20 shadow-md'
                            : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15]'
                        }`}
                      >
                        {/* Micro UI Preview Wireframe */}
                        <div
                          className="w-full h-20 rounded-lg mb-2.5 border overflow-hidden relative p-1.5 flex flex-col justify-between"
                          style={{
                            backgroundColor: theme.canvasBg,
                            borderColor: theme.borderTone,
                          }}
                        >
                          {/* Top row: micro header */}
                          <div
                            className="w-full h-3 rounded px-1.5 flex items-center justify-between border-b"
                            style={{
                              backgroundColor: theme.surfaceBg,
                              borderColor: theme.borderTone,
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: theme.accentColor }}
                              />
                              <span
                                className="w-6 h-0.5 rounded-full"
                                style={{
                                  backgroundColor: theme.isLight ? '#cbd5e1' : '#334155',
                                }}
                              />
                            </div>
                            <span
                              className="text-[8px] font-mono"
                              style={{
                                color: theme.isLight ? '#64748b' : '#94a3b8',
                              }}
                            >
                              {theme.isLight ? 'Light' : 'Dark'}
                            </span>
                          </div>

                          {/* Middle area: micro bubbles */}
                          <div className="flex-1 py-1 px-1 flex flex-col justify-center gap-1">
                            <div
                              className="w-2/3 p-1 rounded border flex flex-col gap-0.5"
                              style={{
                                backgroundColor: theme.surfaceBg,
                                borderColor: theme.borderTone,
                              }}
                            >
                              <span
                                className="w-12 h-0.5 rounded-full"
                                style={{
                                  backgroundColor: theme.isLight ? '#475569' : '#e2e8f0',
                                }}
                              />
                            </div>
                            <div className="self-end">
                              <div
                                className="px-1.5 py-0.5 rounded border"
                                style={{
                                  backgroundColor: theme.isLight ? '#e2e8f0' : '#27272a',
                                  borderColor: theme.borderTone,
                                }}
                              >
                                <span
                                  className="w-6 h-0.5 block rounded-full"
                                  style={{ backgroundColor: theme.accentColor }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bottom accent indicator */}
                          <div
                            className="w-full h-0.5 rounded-full"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>

                        {/* Title & Swatches */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white">
                                {theme.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: theme.canvasBg }}
                                />
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: theme.surfaceBg }}
                                />
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: theme.accentColor }}
                                />
                              </div>
                            </div>

                            {isSelected && (
                              <div
                                className="w-4 h-4 rounded-full text-black flex items-center justify-center shadow-xs"
                                style={{ backgroundColor: theme.accentColor }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 leading-snug line-clamp-1">
                            {theme.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Voice & Preferences Tab */}
            {activeNav === 'preferences' && (
              <div className="space-y-5 max-w-xl">
                {/* Voice Read Aloud Toggle */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white">Audio Read-Aloud</span>
                    <p className="text-[11px] text-stone-400">Listen to step-by-step explanations with voice narration</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVoiceTutor}
                    onChange={(e) => setEnableVoiceTutor(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Voice Speed */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white">Speech Speed</span>
                    <p className="text-[11px] text-stone-400">Rate of audio pronunciation</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    {(['slow', 'normal', 'fast'] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setVoiceSpeed(spd)}
                        className={`px-2.5 py-1 rounded text-xs capitalize transition-all cursor-pointer ${
                          voiceSpeed === spd
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Dictation Status */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Voice Recording & Dictation</span>
                    </span>
                    <p className="text-[11px] text-stone-400">Tap the microphone in the chat input to speak your questions</p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Active</span>
                </div>
              </div>
            )}

            {/* Account & Sign Out Tab */}
            {activeNav === 'account' && (
              <div className="space-y-5 max-w-xl">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-white">Account Information</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Registered Student</label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium">
                        {fullName || currentUser.fullName || 'Student'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Email Address</label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-400 font-mono text-xs">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign Out Card */}
                {onLogout && (
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-rose-300">Sign Out of Session</span>
                      <p className="text-[11px] text-stone-400">Log out safely on this device</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#111] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            Changes personalize EduMind AI solutions and level rigor
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
