import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, Loader2, MapPin, AlertTriangle, Activity,
  Database, Shield, BarChart2, Radio, ChevronRight, CheckCircle,
  Layers, MessageCircle, Zap, TrendingUp, Globe, Lock,
  ArrowRight, Play
} from 'lucide-react';

/* ─── Animated Counter ──────────────────────────────────────────────────── */
const Counter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}{suffix}</span>;
};

/* ─── Floating Well Animation ───────────────────────────────────────────── */
const WellDiagram = () => (
  <svg width="260" height="380" viewBox="0 0 260 380" className="opacity-90">
    {/* Ground surface */}
    <rect x="0" y="0" width="260" height="40" fill="#f1f5f9" rx="4"/>
    <text x="130" y="25" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">SURFACE — 0m</text>
    
    {/* Formation layers */}
    {[
      { y: 40, h: 55, color: '#dbeafe', label: 'Alluvium', depth: '0–250m' },
      { y: 95, h: 55, color: '#bfdbfe', label: 'Tipam Fm.', depth: '250–900m' },
      { y: 150, h: 55, color: '#93c5fd', label: 'Barail Fm.', depth: '900–1800m' },
      { y: 205, h: 55, color: '#60a5fa', label: 'Kopili Fm.', depth: '1800–2500m' },
      { y: 260, h: 65, color: '#3b82f6', label: 'Formation-X ⚠', depth: '2500–3000m', highlight: true },
      { y: 325, h: 55, color: '#1d4ed8', label: 'Formation-Y', depth: '3000–3500m' },
    ].map((f, i) => (
      <g key={i}>
        <rect x="0" y={f.y} width="260" height={f.h} fill={f.color} stroke="#e2e8f0" strokeWidth="1"/>
        <text x="10" y={f.y + f.h/2 + 4} fontSize="9" fill={f.highlight ? '#1e40af' : '#475569'} fontWeight={f.highlight ? '700' : '500'}>{f.label}</text>
        <text x="200" y={f.y + f.h/2 + 4} fontSize="8" fill="#64748b">{f.depth}</text>
        {f.highlight && <rect x="0" y={f.y} width="4" height={f.h} fill="#ef4444"/>}
      </g>
    ))}
    
    {/* Borehole */}
    <rect x="118" y="0" width="24" height="380" fill="none" stroke="#1e293b" strokeWidth="2"/>
    
    {/* Casing */}
    <rect x="121" y="0" width="18" height="200" fill="rgba(148,163,184,0.3)" stroke="#94a3b8" strokeWidth="1.5"/>
    
    {/* Current depth marker */}
    <line x1="80" y1="296" x2="180" y2="296" stroke="#2563eb" strokeWidth="2.5"/>
    <circle cx="80" cy="296" r="4" fill="#2563eb"/>
    <text x="18" y="300" fontSize="9" fill="#2563eb" fontWeight="700">▶ 2820m</text>
    
    {/* Mud loss event */}
    <line x1="80" y1="316" x2="180" y2="316" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"/>
    <circle cx="180" cy="316" r="5" fill="#ef4444"/>
    <text x="188" y="320" fontSize="8" fill="#ef4444" fontWeight="600">⚠ 2850m</text>
    
    {/* Drill bit */}
    <polygon points="126,296 134,296 131,310 129,310" fill="#1e293b"/>
  </svg>
);

/* ─── Feature Card ──────────────────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, color, badge }) => (
  <div className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${color}`} />
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    {badge && (
      <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200">
        {badge}
      </span>
    )}
    <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

/* ─── Role Card ─────────────────────────────────────────────────────────── */
const RoleCard = ({ role, icon: Icon, color, features, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left bg-white rounded-2xl p-6 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`} />
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-md`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-1">{role}</h3>
    <ul className="space-y-1.5 mt-3">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
      Sign in as {role} <ArrowRight className="w-4 h-4" />
    </div>
  </button>
);

/* ─── Main Component ────────────────────────────────────────────────────── */
const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const map = { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', ENGINEER: '/engineer/dashboard' };
      navigate(map[user.role] || '/engineer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setError(msg + ' — Check credentials or use a Quick Access button above.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    const creds = {
      ENGINEER: ['engineer@ertmac.demo', 'Demo@2024'],
      MANAGER:  ['manager@ertmac.demo',  'Demo@2024'],
      ADMIN:    ['admin@ertmac.demo',    'Demo@2024'],
    };
    const [roleEmail, rolePass] = creds[role];
    setEmail(roleEmail);
    setPassword(rolePass);
    setLoginOpen(true);
    setError('');
  };

  const stats = [
    { label: 'Wells Monitored', value: 10, suffix: '+' },
    { label: 'Historical Events', value: 8, suffix: '+' },
    { label: 'Risk Indicators', value: 4, suffix: '' },
    { label: 'AI Confidence', value: 95, suffix: '%' },
  ];

  const features = [
    { icon: Globe, color: 'bg-blue-600', title: 'Geospatial Well Map', badge: 'HERO', desc: 'Interactive OpenStreetMap showing active and offset wells with real-time risk overlays, radius filtering, and distance calculations.' },
    { icon: Zap, color: 'bg-purple-600', title: 'Digital Well Twin', badge: 'HERO', desc: 'Vertical stratigraphic visualization showing formation layers, casing, current depth indicator, and historical event markers from verified data.' },
    { icon: AlertTriangle, color: 'bg-orange-500', title: 'Predictive Risk Radar', badge: 'HERO', desc: 'Deterministic risk scoring: depth proximity (35pts) + distance (25pts) + formation similarity (25pts) + event severity (15pts). Fully transparent.' },
    { icon: TrendingUp, color: 'bg-teal-600', title: 'AI Offset Matching', badge: 'HERO', desc: 'Multi-factor relevance scoring beyond nearest well. Considers geology, depth, event history, and drilling parameters.' },
    { icon: MessageCircle, color: 'bg-indigo-600', title: 'Evidence-Grounded Copilot', badge: 'HERO', desc: 'RAG-powered AI chat using FAISS + Gemini. Every answer cites source documents, page numbers, and verified evidence.' },
    { icon: Shield, color: 'bg-emerald-600', title: 'AI Verification Studio', badge: 'HERO', desc: 'Human-in-the-loop: Admin reviews AI extractions, edits if needed, approves to enter trusted knowledge base. Nothing enters untrusted.' },
    { icon: BarChart2, color: 'bg-slate-700', title: 'Multi-Well Analytics', desc: 'Depth vs torque, ROP, WOB, pressure charts. Compare drilling parameters across wells at the same formation depth.' },
    { icon: Database, color: 'bg-rose-600', title: 'RAG Knowledge Base', desc: 'Sentence Transformer embeddings + FAISS vector search. Semantic retrieval across verified drilling reports with source provenance.' },
    { icon: Activity, color: 'bg-cyan-600', title: 'Operations Intelligence', desc: 'Manager-level overview of all active wells, risk heatmaps, NPT analytics, formation risk insights, and AI briefings.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm tracking-tight">eRTMAC-NWIS</div>
              <div className="text-xs text-slate-400 leading-none">Nearby Wells Intelligence</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#demo" className="hover:text-blue-600 transition-colors">Demo Flow</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">Roles</a>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
          >
            <Lock className="w-4 h-4" /> Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* Left content */}
          <div className="space-y-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-full border border-blue-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-slow" />
                SIH 2026 · Problem Statement 121
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 bg-white/10 text-white/70 rounded-full border border-white/20">
                Oil India Limited
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 bg-white/10 text-white/70 rounded-full border border-white/20">
                Smart Automation
              </span>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                eRTMAC-<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">NWIS</span>
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-blue-200 mt-3">
                Nearby Wells Intelligence System
              </h2>
            </div>

            <p className="text-base text-white/70 leading-relaxed max-w-xl">
              An AI-powered offset well knowledge platform that turns historical drilling experience into proactive intelligence — answering{' '}
              <em className="text-white not-italic font-semibold">"What happened in nearby wells, and is the current well at risk?"</em>
            </p>

            {/* Key questions */}
            <div className="space-y-2">
              {[
                'What happened at this depth in nearby wells?',
                'Did a mud loss occur in the same formation?',
                'What parameters preceded the incident?',
                'How was it resolved — and is it about to recur?',
              ].map((q, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                  </div>
                  {q}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg hover:shadow-blue-500/30 transition-all text-sm"
              >
                <Lock className="w-4 h-4" /> Launch Platform
              </button>
              <button
                onClick={() => quickLogin('ENGINEER')}
                className="flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-all text-sm"
              >
                <Play className="w-4 h-4" /> Try Demo
              </button>
            </div>

            <p className="text-xs text-white/30">
              ⚠ Representative Demonstration Data · Not Real Oil India Operational Data
            </p>
          </div>

          {/* Right — well twin + stats */}
          <div className="flex flex-col items-center gap-8">
            {/* Live stats */}
            <div className="w-full grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-2xl font-black text-white">
                    <Counter target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-white/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Well diagram */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-xs font-semibold text-white/60 text-center mb-3 uppercase tracking-wider">
                Digital Well Twin — WELL-101
              </div>
              <WellDiagram />
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="w-6 h-0.5 bg-blue-400" />
                  Current depth: 2820m
                </div>
                <div className="flex items-center gap-2 text-xs text-red-300">
                  <div className="w-6 h-0.5 bg-red-400" />
                  Historical mud loss: 2850m (WELL-103)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs animate-bounce">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
          Scroll
        </div>
      </section>

      {/* ── Risk Alert Banner ── */}
      <section className="bg-gradient-to-r from-orange-600 to-red-600 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-sm">DEMO SCENARIO ACTIVE:</span>
            <span className="text-sm opacity-90">WELL-101 at 2820m · 30m from historical MUD LOSS in WELL-103 · HIGH RISK INDICATOR</span>
          </div>
          <button onClick={() => quickLogin('ENGINEER')} className="flex items-center gap-1.5 text-sm font-bold text-white border border-white/40 px-4 py-1.5 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap">
            View Live Alert <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Platform Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">5 Hero Features + Full Suite</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Every visible feature works end-to-end with real database data and AI intelligence.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Demo Flow ── */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">End-to-End Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">SIH Demo Flow</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">A complete 22-step workflow from real-time monitoring to verified AI knowledge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { phase: 'ENGINEER', color: 'blue', steps: [
                'Login as Engineer → WELL-101 dashboard',
                'View current depth: 2820m in Formation-X',
                'Open Well Map → WELL-103 appears 2.1km away',
                'Offset Intelligence → Formation + depth match',
                'System detects: MUD LOSS at 2850m (30m ahead)',
                'HIGH RISK alert generated with full evidence',
                'Click "Ask AI" → RAG retrieves WELL-103 DDR',
                'Gemini explains risk with source citations',
                'View Digital Well Twin → formation + event markers',
                'Incident Replay → historical sequence visualized',
              ]},
              { phase: 'MANAGER', color: 'teal', steps: [
                'Switch to Manager → Operations overview',
                'Risk heatmap → all wells colored by risk level',
                'AI Briefing → grounded ops summary generated',
                'NPT analytics → formation risk breakdown',
              ]},
              { phase: 'ADMIN', color: 'purple', steps: [
                'Upload demonstration PDF drilling report',
                'Process report → AI extracts events + depths',
                'Extraction Review → compare AI vs source',
                'Edit if needed → click Approve',
                'Knowledge indexed into FAISS vector store',
                'Engineer searches again → new evidence appears',
                'Data Quality dashboard → integrity monitoring',
                'Audit Logs → full action trail recorded',
              ]},
            ].map((phase, pi) => (
              <div key={pi} className={`rounded-2xl border p-6 ${
                phase.color === 'blue' ? 'border-blue-100 bg-blue-50' :
                phase.color === 'teal' ? 'border-teal-100 bg-teal-50' :
                'border-purple-100 bg-purple-50'
              } ${pi === 0 ? 'md:row-span-2' : ''}`}>
                <div className={`text-xs font-black uppercase tracking-widest mb-4 ${
                  phase.color === 'blue' ? 'text-blue-600' :
                  phase.color === 'teal' ? 'text-teal-600' : 'text-purple-600'
                }`}>{phase.phase} FLOW</div>
                <div className="space-y-2.5">
                  {phase.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white ${
                        phase.color === 'blue' ? 'bg-blue-600' :
                        phase.color === 'teal' ? 'bg-teal-600' : 'bg-purple-600'
                      }`}>{si + 1}</div>
                      <span className="text-sm text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Access Control</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Three Role-Based Dashboards</h2>
            <p className="text-slate-500 mt-3">Click a role to sign in instantly with demo credentials.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              role="Engineer"
              icon={Radio}
              color="bg-blue-600"
              features={['Live Drilling Command Center', 'Risk Radar + Alerts', 'Digital Well Twin', 'AI Drilling Copilot', 'Offset Intelligence', 'Incident Replay', 'Multi-Well Analytics']}
              onClick={() => quickLogin('ENGINEER')}
            />
            <RoleCard
              role="Manager"
              icon={BarChart2}
              color="bg-teal-600"
              features={['Operations Intelligence Center', 'Enterprise Risk Heatmap', 'AI Operations Briefing', 'Well Performance Analytics', 'Incident + NPT Analytics', 'Team Alert Monitoring', 'Formation Risk Insights']}
              onClick={() => quickLogin('MANAGER')}
            />
            <RoleCard
              role="Admin"
              icon={Shield}
              color="bg-purple-700"
              features={['User & Role Management', 'AI Extraction Verification', 'Knowledge Base Indexing', 'Data Quality Dashboard', 'Audit Trail Logs', 'System Health Monitor', 'Trusted Knowledge Approval']}
              onClick={() => quickLogin('ADMIN')}
            />
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Technical Architecture</span>
            <h2 className="text-3xl font-black text-slate-900 mt-3">Full-Stack Intelligence Pipeline</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                layer: 'Frontend', icon: Globe, color: 'bg-blue-600',
                tech: ['React 18 + Vite', 'Tailwind CSS', 'Recharts', 'Leaflet + OpenStreetMap', 'React Router v6', 'JWT Auth'],
                role: 'All three role dashboards, interactive map, charts, AI chat, digital well twin'
              },
              {
                layer: 'Backend', icon: Database, color: 'bg-slate-700',
                tech: ['Node.js + Express', 'MongoDB + Mongoose', 'JWT + bcrypt', 'Helmet + CORS', 'Rate Limiting', 'Audit Logging'],
                role: 'REST API, RBAC, risk engine, report upload, analytics, AI orchestration'
              },
              {
                layer: 'AI Service', icon: Zap, color: 'bg-purple-700',
                tech: ['Python + FastAPI', 'PyMuPDF (PDF)', 'Sentence Transformers', 'FAISS (vectors)', 'Google Gemini', 'Heuristic fallback'],
                role: 'PDF extraction, embeddings, semantic search, RAG chat, grounded answers'
              },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{s.layer}</h3>
                <p className="text-xs text-slate-400 mb-4">{s.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tech.map((t, ti) => (
                    <span key={ti} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to explore the platform?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">Sign in with a demo account to experience the full workflow.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['ENGINEER', 'MANAGER', 'ADMIN'].map(role => (
              <button key={role} onClick={() => quickLogin(role)}
                className="px-8 py-3.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">
                Launch as {role}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-6">Password: Demo@2024 · Representative Demonstration Data Only</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center">
              <Radio className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">eRTMAC-NWIS</div>
              <div className="text-xs text-slate-500">SIH 2026 · Problem Statement 121</div>
            </div>
          </div>
          <div className="text-xs text-slate-600 text-center">
            "Turning Historical Drilling Experience into Proactive Intelligence."<br/>
            <span className="text-slate-700">All data is representative demonstration data only — not real Oil India operational data.</span>
          </div>
          <div className="text-xs text-slate-600">Oil India Limited · Smart Automation</div>
        </div>
      </footer>

      {/* ── Login Modal ── */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setLoginOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Modal header */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-8 text-center relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Radio className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">eRTMAC-NWIS</h2>
                <p className="text-blue-200 text-sm mt-1">Nearby Wells Intelligence System</p>
              </div>
            </div>

            <div className="p-8">
              {/* Demo quick-access */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center mb-1">
                  1. Choose a Demo Account to Fill Form
                </p>
                <p className="text-[11px] text-slate-400 text-center mb-3">
                  (Fills email & password below — then click Sign In)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'ENGINEER', email: 'engineer@ertmac.demo' },
                    { role: 'MANAGER', email: 'manager@ertmac.demo' },
                    { role: 'ADMIN', email: 'admin@ertmac.demo' },
                  ].map(({ role, email: roleEmail }) => {
                    const isSelected = email === roleEmail;
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => quickLogin(role)}
                        disabled={loading}
                        className={`py-2.5 text-xs font-bold border-2 rounded-xl transition-all disabled:opacity-50 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isSelected ? `✓ ${role}` : role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or sign in with email</span></div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>{error}</div>
                    <div className="mt-2 text-xs text-red-500 bg-red-100 rounded-lg p-2 font-mono leading-relaxed">
                      Demo accounts (all use password <strong>Demo@2024</strong>):<br/>
                      admin@ertmac.demo<br/>
                      engineer@ertmac.demo<br/>
                      manager@ertmac.demo
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                    placeholder="your@email.com or demo email above" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 pr-11"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-md">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><Lock className="w-4 h-4" /> Sign In</>}
                </button>
              </form>

              {/* Demo credentials hint */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                <p className="font-semibold text-slate-600 mb-1">Demo Credentials</p>
                <div className="space-y-0.5 font-mono text-xs">
                  <div>admin@ertmac.demo · <span className="text-slate-400">Demo@2024</span></div>
                  <div>engineer@ertmac.demo · <span className="text-slate-400">Demo@2024</span></div>
                  <div>manager@ertmac.demo · <span className="text-slate-400">Demo@2024</span></div>
                </div>
                <p className="mt-1.5 text-slate-400">Or use the quick-access buttons above ↑</p>
              </div>

              <button onClick={() => setLoginOpen(false)} className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
