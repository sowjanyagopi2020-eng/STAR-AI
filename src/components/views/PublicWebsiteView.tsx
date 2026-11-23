import React, { useState } from 'react';
import {
  Globe,
  GraduationCap,
  Sparkles,
  Download,
  Send,
  Building,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { AdmissionEnquiry } from '../../types/school.ts';
import { StarAILogo } from '../common/StarAILogo.tsx';

interface PublicWebsiteViewProps {
  enquiries: AdmissionEnquiry[];
  onAddEnquiry: (enquiry: Partial<AdmissionEnquiry>) => Promise<any>;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  enquiries,
  onAddEnquiry,
}) => {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    contactNumber: '',
    email: '',
    gradeApplied: 'Grade 9',
    notes: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.parentName || !formData.contactNumber) {
      setFormError('Please fill out student name, parent name, and phone number.');
      return;
    }
    setFormError(null);

    await onAddEnquiry(formData);
    setIsSubmitted(true);
    setFormData({
      studentName: '',
      parentName: '',
      contactNumber: '',
      email: '',
      gradeApplied: 'Grade 9',
      notes: '',
    });
  };

  return (
    <div className="space-y-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 px-6 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <StarAILogo size={24} className="shrink-0" />
          <span className="font-semibold text-white">STAR AI Academy</span>
          <span className="text-slate-500">·</span>
          <span>www.starai.edu</span>
        </div>
        <span className="text-[11px] font-mono text-amber-400">Admissions Open 2026-27</span>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-96 w-full relative overflow-hidden">
          <img
            src="/src/assets/images/school_campus_exterior_1794467308073.jpg"
            alt="STAR AI Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-end">
            <div className="p-8 text-white max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation AI & STEM Academy</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                One School. One Platform. Complete Intelligence.
              </h1>
              <p className="text-sm text-slate-200 max-w-xl">
                Nurturing inquisitive minds and pioneering global leaders through holistic education, cutting-edge AI learning laboratories, and world-class faculty.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-12">
        {/* Principal's Message Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="md:col-span-1 text-center">
            <img
              src="/src/assets/images/school_principal_portrait_1794467311459.jpg"
              alt="Principal Dr. Evelyn Reed"
              className="w-44 h-44 rounded-2xl object-cover mx-auto shadow-md border-2 border-amber-400/80"
            />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
              Dr. Evelyn Reed, Ph.D.
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Head of Academy & Principal</p>
          </div>

          <div className="md:col-span-2 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Principal's Welcome Note
            </h3>
            <p>
              "At STAR AI Academy, our mission is to redefine primary and secondary education for the century ahead. By pairing human pedagogical mentorship with our bespoke STAR AI cognitive engines, every scholar receives a personalized learning trajectory tailored to their intellectual passions."
            </p>
            <p>
              "We invite prospective families to discover an academic community dedicated to integrity, innovation, and international scholarship."
            </p>
          </div>
        </div>

        {/* Facilities & STEM Lab Spotlight */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              World-Class Infrastructure & STEM Laboratories
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Purpose-built spaces designed for experiential research and creative exploration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-72 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
              <img
                src="/src/assets/images/school_stem_lab_1794467308397.jpg"
                alt="STAR Robotics & AI Lab"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Cognitive AI & Robotics Research Lab
                </h4>
                <p className="text-slate-500 mt-1">
                  Equipped with real microcontrollers, automated sensory breadboards, and neural model simulators for hands-on machine intelligence education.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Olympic Aquatics & Athletics Complex
                </h4>
                <p className="text-slate-500 mt-1">
                  50-meter temperature-controlled competition pool, all-weather synthetic track, indoor badminton courts, and certified sports biomechanics trainers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Online Admission Enquiry Form */}
        <div className="p-6 md:p-8 rounded-2xl bg-linear-to-b from-blue-50/50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Online Admission Enquiry & Campus Tour Booking
              </h3>
              <p className="text-xs text-slate-500">
                Submit your enquiry below. Our Admissions Dean will reach out within 24 hours.
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Enquiry Successfully Registered!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Thank you for your interest in STAR AI Academy. Our admissions officer has received your application and will contact you shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Applicant Scholar Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="e.g. Maya Chen"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Samuel Chen"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactNumber}
                      onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Grade Applying For
                  </label>
                  <select
                    value={formData.gradeApplied}
                    onChange={e => setFormData({ ...formData, gradeApplied: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Grade 9">Grade 9 (Foundational Secondary)</option>
                    <option value="Grade 10">Grade 10 (Secondary Board)</option>
                    <option value="Grade 11">Grade 11 (Senior Secondary - STEM/AI)</option>
                    <option value="Grade 12">Grade 12 (Senior Secondary - Pre-University)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Special Interests / Questions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tell us about scholar achievements or scholarship enquiries..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Admission Enquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
