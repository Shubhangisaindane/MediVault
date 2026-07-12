import Link from 'next/link';
import { 
  ShieldCheck, 
  Activity, 
  Calendar, 
  FileText, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { getSessionUser } from '@/lib/auth';

export default async function LandingPage() {
  const user = await getSessionUser();

  const features = [
    {
      icon: <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Patient Intake & EHR",
      description: "Manage complete patient demographics, medical history, vital charts, and diagnostic notes under secure records."
    },
    {
      icon: <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Intelligent Scheduling",
      description: "Book, reschedule, or cancel appointments. Built-in physician schedule overlap and conflict prevention."
    },
    {
      icon: <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "E-Prescriptions",
      description: "Write prescriptions connected directly to the pharmacy inventory. Export patient prescriptions to print-ready PDF formats."
    },
    {
      icon: <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Billing & Invoicing",
      description: "Generate bills automatically from clinical visits. Track payment methods, due dates, taxes, and generate financial receipts."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Clinical Analytics",
      description: "Real-time analytics dashboards for hospital administrators showing appointment stats, revenue trends, and intake graphs."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "HIPAA Auditing",
      description: "Automatic background audit logging trails tracking every document view, modification, and access level change."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-filter backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              MediVault
            </span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Features</a>
            <a href="#security" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Security</a>
            <a href="#about" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link 
                href="/dashboard" 
                className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
              >
                Enter Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 px-4 py-2"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 stroke-slate-200 [mask-image:radial-gradient(600px_600px_at_top,white,transparent)] dark:stroke-slate-800">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Empowering Modern Clinical Workflows
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-8">
            The Digital Vault for <br/>
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Healthcare Operations
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            A production-ready Electronic Health Record (EHR) and administrative dashboard designed for clinical teams, doctors, receptionists, and patients. Secure, auditable, and HIPAA-designed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link 
                href="/dashboard" 
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white shadow-md shadow-emerald-500/10 transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 w-full sm:w-auto"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/signup" 
                  className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white shadow-md shadow-emerald-500/10 transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 w-full sm:w-auto"
                >
                  Register as Patient
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 w-full sm:w-auto"
                >
                  Access Portal Login
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">99.9%</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">256-bit</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Audit Logged</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">&lt; 3 clicks</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Action Flow</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Integrated Clinic Framework</h2>
            <p className="text-slate-600 dark:text-slate-400">
              One application to run your entire practice. Everything you need from registrations to medical notes and invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col p-8 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 transition-all hover:border-emerald-500/30 hover:shadow-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 transition-transform group-hover:scale-110">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 flex-1">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HIPAA/Security Trust Banner */}
      <section id="security" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">HIPAA Compliance & Data Auditing</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Patient health data is extremely sensitive. MediVault enforces field-level access restriction, session timeouts, and automatic cryptographically isolated audit logging. Every patient record viewed, created, or updated leaves an immutable log containing actor ID, entity details, action type, and timestamps.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> AES-256 Encryption</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Secure HTTPS (SSL)</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Strict RBAC Tokens</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Lockout Counter Defense</div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span className="font-bold tracking-tight">MediVault</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MediVault Inc. All rights reserved. Built for Digital Heroes Full Stack Trial.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-slate-500">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
