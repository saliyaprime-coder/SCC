import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import { useThreeScene } from "../hooks/useThreeScene";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "10K+", label: "Study Groups" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "Avg Rating" },
];

const features = [
  { icon: "📝", tag: "Notes", title: "Smart Notes Sharing", desc: "Upload, organize, and share lecture notes with your peers. AI-powered summaries help you study smarter." },
  { icon: "👥", tag: "Groups", title: "Study Groups", desc: "Create or join study groups, collaborate in real-time, and keep everyone on the same page." },
  { icon: "📅", tag: "Schedule", title: "Timetable Manager", desc: "Manage your class schedule, set reminders, and never miss a lecture or deadline again." },
  { icon: "🤖", tag: "AI", title: "AI Study Assistant", desc: "Get instant answers, generate flashcards, and receive personalized study recommendations." },
  { icon: "💬", tag: "Chat", title: "Real-time Messaging", desc: "Chat with classmates, share files, and stay connected with your study groups instantly." },
  { icon: "🎓", tag: "Kuppi", title: "Kuppi Sessions", desc: "Find or host peer tutoring sessions. Learn from the best students in your university." },
];

const steps = [
  { n: "01", title: "Create your account", desc: "Sign up in seconds with your university email. No credit card required." },
  { n: "02", title: "Join or create groups", desc: "Find your course groups or create new ones. Invite classmates to collaborate." },
  { n: "03", title: "Start collaborating", desc: "Share notes, schedule study sessions, chat in real-time, and leverage AI tools." },
  { n: "04", title: "Ace your semester", desc: "Stay organized, study smarter, and achieve the grades you deserve." },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [counters, setCounters] = useState({ students: 0, groups: 0, uptime: 0, rating: 0 });
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const profileMenuRef = useRef(null);
  const aiShowcaseRef = useRef(null);
  const intelligenceRef = useRef(null);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Three.js scene (forest)
  const { groupRef, centralMeshRef } = useThreeScene(canvasRef);

  // Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    lenis.on("scroll", () => ScrollTrigger.update());

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after Lenis takes over scroll handling
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP animations for UI elements only (no Three.js)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero fade-in
      gsap.from("[data-hero]", {
        y: 50,
        opacity: 0,
        duration: 1.1,
        stagger: 0.1,
        ease: "power4.out",
        delay: 0.2,
      });

      // AI Showcase slide-in
      gsap.from("[data-ai]", {
        scrollTrigger: { trigger: ".ai-showcase", start: "top 80%" },
        x: (i) => (i % 2 === 0 ? -80 : 80),
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Intelligence counters
      gsap.to({}, {
        scrollTrigger: { trigger: intelligenceRef.current, start: "top 80%" },
        onStart: () => {
          gsap.to(counters, {
            students: 50000,
            groups: 10000,
            uptime: 99.9,
            rating: 4.9,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => setCounters({ ...counters }),
          });
        },
      });

      // Stats
      gsap.from("[data-stat]", {
        scrollTrigger: { trigger: ".stats-row", start: "top 85%" },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Features
      gsap.from("[data-feat]", {
        scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      });

      // Steps
      gsap.from("[data-step]", {
        scrollTrigger: { trigger: ".steps-list", start: "top 78%" },
        x: -60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: "power2.out",
      });

      // CTA
      gsap.from("[data-cta]", {
        scrollTrigger: { trigger: ".cta-block", start: "top 82%" },
        scale: 0.94,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
      });

      // NOTE: No Three.js animations here – they are all handled inside useThreeScene
    }, rootRef);

    return () => ctx.revert();
  }, [groupRef, centralMeshRef]); // dependencies kept but not used – safe

  // Magnetic button effect
  useEffect(() => {
    const btns = document.querySelectorAll(".btn-hero-primary, .btn-hero-ghost");
    const onMouseMove = (e, btn) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.3, overwrite: true });
    };
    const onMouseLeave = (btn) => gsap.to(btn, { x: 0, y: 0, duration: 0.5 });
    btns.forEach(btn => {
      btn.addEventListener("mousemove", (e) => onMouseMove(e, btn));
      btn.addEventListener("mouseleave", () => onMouseLeave(btn));
    });
    return () => {
      btns.forEach(btn => {
        btn.removeEventListener("mousemove", onMouseMove);
        btn.removeEventListener("mouseleave", onMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        /* Fonts - only load what you need */
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #020817;
          --surface: rgba(255,255,255,0.03);
          --border: rgba(255,255,255,0.07);
          --border-glow: rgba(0,212,255,0.2);
          --cyan: #00d4ff;
          --violet: #7c3aed;
          --cyan-dim: rgba(0,212,255,0.15);
          --violet-dim: rgba(124,58,237,0.15);
          --text: #f0f4ff;
          --muted: rgba(240,244,255,0.5);
          --font-head: 'Space Grotesk', sans-serif;
          --font-body: 'Inter', sans-serif;
        }

        html {
          scroll-behavior: auto;
        }

        body {
          font-family: var(--font-body);
          font-weight: 400;
          letter-spacing: -0.01em;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        h1, h2, h3, .brand, .stat-val, .btn-hero-primary {
          font-family: var(--font-head);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .page {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        /* Override global index.css light-theme element selectors inside Home */
        .page h1, .page h2, .page h3, .page h4, .page h5, .page h6 {
          color: var(--text);
        }
        .page p {
          color: var(--muted);
        }
        .page a {
          color: inherit;
        }

        /* Canvas */
        .bg-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          will-change: transform; /* hint for GPU */
        }

        /* Noise overlay - CSS grain (very light) */
        .noise {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.02;
          background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGjSURBVGiB7Zm9TsMwFIW/tFKLWFhYkVj4kXgAnod34QUYGZl5A1ZGxAKqQA2mTePrwTex3dhJnfN5uZZvzr0+tksE+wqsgS3gFfAMbAvvIjCT+j1wBTwBj8Aj8Ag8AI+lIm6AN+AGuAdeioUKZq/AY9YqdhzYBc6AU+AEOA/cAqfAKXAOnAHnwEU2FtmxRDqbiyzAFJhkvU9l4gVwHYnwMbAP7ANHZOMAOAJ2ip/XZX1XFnmQ9V1l/yIb+wr4DPjI+q8Br8x4YkIWKvUNPMQAAAAASUVORK5CYII=");
          background-repeat: repeat;
        }

        /* Illustrative scan-line overlay */
        .illustrative-overlay {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.015) 0px,
            rgba(0, 0, 0, 0.015) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: overlay;
        }

        /* Gradient overlays */
        .bg-grad {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 20% 20%, rgba(0,212,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(124,58,237,0.07) 0%, transparent 70%),
            linear-gradient(180deg, rgba(2,8,23,0) 0%, rgba(2,8,23,0.5) 100%);
        }

        /* Nav (unchanged) */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
          height: 68px;
          display: flex;
          align-items: center;
          transition: background 0.4s, border-color 0.4s;
          border-bottom: 1px solid transparent;
        }
        nav.scrolled {
          background: rgba(2,8,23,0.85);
          backdrop-filter: blur(18px);
          border-color: var(--border);
        }
        .nav-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .brand {
          font-family: var(--font-head);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }
        .brand-dot {
          width: 8px; height: 8px;
          background: var(--cyan);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--cyan);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
        }
        .nav-links button {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.9rem;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          letter-spacing: 0.01em;
        }
        .nav-links button:hover { color: var(--text); background: var(--surface); }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .btn-ghost {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted);
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 1.1rem;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .btn-ghost:hover {
          color: #fff;
          border-color: var(--cyan);
          background: rgba(0,212,255,0.08);
        }
        .btn-solid {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 600;
          color: #020817;
          background: var(--cyan);
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.2rem;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 16px rgba(0,212,255,0.3);
        }
        .btn-solid:hover { opacity: 0.88; box-shadow: 0 0 28px rgba(0,212,255,0.5); }

        /* Main */
        main {
          position: relative;
          z-index: 10;
        }

        /* HERO (unchanged) */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8rem clamp(1.5rem, 5vw, 4rem) 5rem;
        }
        .hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cyan);
          background: var(--cyan-dim);
          border: 1px solid rgba(0,212,255,0.2);
          padding: 0.35rem 0.9rem;
          border-radius: 100px;
          margin-bottom: 2rem;
        }
        .hero-tag::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--cyan);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--cyan);
        }
        .hero-title {
          font-family: var(--font-head);
          font-size: clamp(2.8rem, 6.5vw, 5.5rem);
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: var(--text);
          max-width: 820px;
          margin-bottom: 1.6rem;
        }
        .hero-title em {
          font-style: normal;
          background: linear-gradient(135deg, var(--cyan) 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          color: var(--muted);
          max-width: 560px;
          line-height: 1.7;
          margin-bottom: 2.5rem;
          font-weight: 400;
        }
        .hero-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          margin-bottom: 4.5rem;
        }
        .btn-hero-primary {
          font-family: var(--font-head);
          font-size: 1rem;
          font-weight: 700;
          color: #020817;
          background: var(--cyan);
          border: none;
          border-radius: 10px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: -0.01em;
          box-shadow: 0 0 30px rgba(0,212,255,0.35);
          transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .btn-hero-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 6px 40px rgba(0,212,255,0.5); }
        .btn-hero-ghost {
          font-family: var(--font-head);
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-hero-ghost:hover { border-color: rgba(0,212,255,0.3); background: var(--cyan-dim); transform: translateY(-2px); }

        /* Stats */
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem 3.5rem;
        }
        .stat-val {
          font-family: var(--font-head);
          font-size: 2rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .stat-label {
          font-size: 0.8rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Divider */
        .divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border) 30%, var(--border) 70%, transparent);
          max-width: 1280px;
          margin: 0 auto;
        }

        /* FEATURES */
        .section {
          padding: 7rem clamp(1.5rem, 5vw, 4rem);
        }
        .section-inner { max-width: 1280px; margin: 0 auto; }
        .section-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--cyan);
          margin-bottom: 1rem;
        }
        .section-title {
          font-family: var(--font-head);
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          max-width: 600px;
          line-height: 1.1;
          margin-bottom: 4rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.25rem;
        }
        .feat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.8rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, background 0.3s, transform 0.25s;
          cursor: default;
          will-change: transform, border-color; /* GPU hint */
        }
        .feat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feat-card:hover { border-color: var(--border-glow); background: rgba(0,212,255,0.03); transform: translateY(-4px); }
        .feat-card:hover::before { opacity: 1; }
        .feat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
        }
        .feat-icon {
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          background: var(--cyan-dim);
          border: 1px solid rgba(0,212,255,0.18);
          border-radius: 10px;
          font-size: 1.1rem;
          color: var(--cyan);
        }
        .feat-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--muted);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 0.2rem 0.6rem;
        }
        .feat-title {
          font-family: var(--font-head);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.6rem;
          letter-spacing: -0.02em;
        }
        .feat-desc {
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 400;
        }

        /* STEPS (unchanged) */
        .steps-section {
          padding: 5rem clamp(1.5rem, 5vw, 4rem) 7rem;
          background: linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.03) 50%, transparent 100%);
        }
        .steps-wrap { max-width: 1280px; margin: 0 auto; }
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }
        .steps-left .section-title { margin-bottom: 1.5rem; }
        .steps-desc {
          font-size: 0.95rem;
          color: var(--muted);
          line-height: 1.75;
          font-weight: 400;
          margin-bottom: 2rem;
        }
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .step-item {
          display: flex;
          gap: 1.5rem;
          position: relative;
          padding-bottom: 2.5rem;
        }
        .step-item:last-child { padding-bottom: 0; }
        .step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .step-num {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border-glow);
          background: var(--cyan-dim);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--cyan);
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .step-line {
          flex: 1;
          width: 1px;
          background: linear-gradient(180deg, var(--border-glow), var(--border));
          margin-top: 0.5rem;
        }
        .step-item:last-child .step-line { display: none; }
        .step-content { padding-top: 0.6rem; }
        .step-title {
          font-family: var(--font-head);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.4rem;
          letter-spacing: -0.02em;
        }
        .step-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.65; font-weight: 400; }

        /* Steps right: glow card */
        .glow-card {
          background: linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(124,58,237,0.06) 100%);
          border: 1px solid var(--border-glow);
          border-radius: 20px;
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .glow-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .glow-card-title {
          font-family: var(--font-head);
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.025em;
          margin-bottom: 0.75rem;
        }
        .glow-card-sub { font-size: 0.9rem; color: var(--muted); line-height: 1.65; margin-bottom: 1.8rem; font-weight: 400; }
        .mini-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .mini-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1rem;
        }
        .mini-stat-val {
          font-family: var(--font-head);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--cyan);
          letter-spacing: -0.03em;
          margin-bottom: 0.2rem;
        }
        .mini-stat-lbl { font-size: 0.75rem; color: var(--muted); font-weight: 400; }
        .glow-card-btn {
          width: 100%;
          font-family: var(--font-head);
          font-size: 0.95rem;
          font-weight: 700;
          color: #020817;
          background: var(--cyan);
          border: none;
          border-radius: 10px;
          padding: 0.9rem;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
          letter-spacing: -0.01em;
          box-shadow: 0 0 24px rgba(0,212,255,0.3);
          transition: opacity 0.2s, box-shadow 0.2s;
        }
        .glow-card-btn:hover { opacity: 0.88; box-shadow: 0 0 40px rgba(0,212,255,0.5); }

        /* CTA */
        .cta-section {
          padding: 5rem clamp(1.5rem, 5vw, 4rem) 8rem;
        }
        .cta-block {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          background: linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(124,58,237,0.05) 100%);
          border: 1px solid var(--border-glow);
          border-radius: 24px;
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 5vw, 5rem);
          position: relative;
          overflow: hidden;
        }
        .cta-block::before {
          content: '';
          position: absolute;
          bottom: -80px; left: 50%;
          transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 1.5rem;
        }
        .cta-title {
          font-family: var(--font-head);
          font-size: clamp(2rem, 4.5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          line-height: 1.08;
          margin-bottom: 1.25rem;
        }
        .cta-sub {
          font-size: 1rem;
          color: var(--muted);
          max-width: 480px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
          font-weight: 400;
        }
        .cta-btns {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.9rem;
        }

        /* Profile avatar */
        .profile-wrapper {
          position: relative;
        }
        .profile-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-transform: uppercase;
          user-select: none;
        }
        .profile-avatar:hover {
          border-color: var(--cyan);
          box-shadow: 0 0 12px rgba(0,212,255,0.35);
        }
        .profile-avatar img {
          width: 100%; height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: rgba(2,8,23,0.95);
          backdrop-filter: blur(18px);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.5rem 0;
          z-index: 200;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-dropdown-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .profile-dropdown-name {
          font-family: var(--font-head);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text);
        }
        .profile-dropdown-email {
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.15rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .profile-dropdown a,
        .profile-dropdown button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.6rem 1rem;
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
        }
        .profile-dropdown a:hover,
        .profile-dropdown button:hover {
          color: var(--text);
          background: rgba(255,255,255,0.04);
        }
        .profile-dropdown .logout-btn {
          color: #ff4d6d;
          border-top: 1px solid var(--border);
          margin-top: 0.25rem;
          padding-top: 0.7rem;
        }
        .profile-dropdown .logout-btn:hover {
          background: rgba(255,77,109,0.08);
          color: #ff6b8a;
        }

        /* Footer */
        footer {
          border-top: 1px solid var(--border);
          padding: 2rem clamp(1.5rem, 5vw, 4rem);
          position: relative;
          z-index: 10;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-brand {
          font-family: var(--font-head);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .footer-copy { font-size: 0.78rem; color: rgba(240,244,255,0.2); }

        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr; }
          .steps-right { position: static; }
          .nav-links, .nav-actions .btn-ghost { display: none; }
        }
        @media (max-width: 600px) {
          .stats-row { gap: 1.5rem 2.5rem; }
        }

        /* ===== NEW STYLES FOR ADDED SECTIONS ===== */
        .ai-showcase {
          padding: 5rem clamp(1.5rem, 5vw, 4rem);
          background: linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.02) 50%, transparent 100%);
        }
        .ai-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .ai-visual {
          background: var(--surface);
          border: 1px solid var(--border-glow);
          border-radius: 24px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .mock-ui {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          background: rgba(0,212,255,0.1);
          padding: 1rem;
          border-radius: 12px;
        }
        .calendar-grid::before {
          content: "M T W T F S S";
          white-space: pre;
          color: var(--cyan);
          font-size: 0.7rem;
          letter-spacing: 2px;
          grid-column: span 7;
        }
        .ai-content h2 {
          font-family: var(--font-head);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 1rem;
        }
        .ai-content p {
          color: var(--muted);
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .ai-content ul {
          list-style: none;
        }
        .ai-content li {
          color: var(--text);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .intelligence-section {
          padding: 5rem clamp(1.5rem, 5vw, 4rem);
        }
        .intelligence-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }
        .counters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .counter-item {
          text-align: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem 1rem;
        }
        .counter-value {
          font-family: var(--font-head);
          font-size: 3rem;
          font-weight: 800;
          color: var(--cyan);
        }
        .counter-label {
          color: var(--muted);
          font-size: 0.9rem;
        }
        .graph-bars {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          height: 200px;
          background: var(--surface);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .bar {
          flex: 1;
          background: linear-gradient(to top, var(--cyan), var(--violet));
          border-radius: 4px 4px 0 0;
          transform-origin: bottom;
          transform: scaleY(0);
          transition: transform 1s ease;
          height: 100%;
        }
        .intelligence-section.in-view .bar {
          transform: scaleY(var(--height));
        }

        @media (max-width: 900px) {
          .ai-grid, .intelligence-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page" ref={rootRef}>
        <div className="bg-canvas" ref={canvasRef} />
        <div className="bg-grad" />
        <div className="noise" />
        <div className="illustrative-overlay" />

        {/* NAV */}
        <nav className={scrolled ? "scrolled" : ""}>
          <div className="nav-inner">
            <button className="brand">
              <div className="brand-dot" />
              CampusIQ
            </button>
            <div className="nav-links">
              <button onClick={() => document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
              <button onClick={() => document.querySelector(".steps-section")?.scrollIntoView({ behavior: "smooth" })}>How It Works</button>
            </div>
            <div className="nav-actions" style={{ marginLeft: "auto" }}>
              {isAuthenticated ? (
                <div className="profile-wrapper" ref={profileMenuRef}>
                  <div
                    className="profile-avatar"
                    onClick={() => setProfileOpen((v) => !v)}
                    title={user?.name || "Profile"}
                  >
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      (user?.name?.[0] || "U")
                    )}
                  </div>
                  {profileOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-header">
                        <div className="profile-dropdown-name">{user?.name || "User"}</div>
                        <div className="profile-dropdown-email">{user?.email || ""}</div>
                      </div>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                      <Link to="/groups" onClick={() => setProfileOpen(false)}>My Groups</Link>
                      <Link to="/notes" onClick={() => setProfileOpen(false)}>My Notes</Link>
                      <button className="logout-btn" onClick={() => { dispatch(logout()); setProfileOpen(false); }}>Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Sign In</Link>
                  <Link to="/register" className="btn-solid">Register</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <main>
          {/* HERO */}
          <section className="hero">
            <div className="hero-inner">
              <p className="hero-tag" data-hero>Smart Campus Operating System</p>
              <h1 className="hero-title" data-hero>
                Your academic life,<br />
                <em>finally under control.</em>
              </h1>
              <p className="hero-sub" data-hero>
                CampusIQ brings together notes sharing, study sessions, team collaboration, and AI-powered insights — all in one beautifully designed workspace.
              </p>
              <div className="hero-btns" data-hero>
                <Link to="/register" className="btn-hero-primary">Launch Your Workspace →</Link>
                <button
                  className="btn-hero-ghost"
                  onClick={() => document.querySelector(".features-grid")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Features
                </button>
              </div>
              <div className="stats-row">
                {stats.map((s) => (
                  <div className="stat-item" data-stat key={s.label}>
                    <div className="stat-val">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* NEW: AI Timetable Showcase */}
          <section className="ai-showcase" ref={aiShowcaseRef}>
            <div className="ai-grid">
              <div className="ai-visual" data-ai>
                <div className="mock-ui">
                  <div className="calendar-grid" />
                </div>
              </div>
              <div className="ai-content" data-ai>
                <h2>AI-Powered Smart Timetable</h2>
                <p>
                  Upload your university timetable. Our AI analyzes conflicts, preferences, and productivity cycles to generate your optimized personal schedule.
                </p>
                <ul>
                  <li>✔ Conflict detection</li>
                  <li>✔ Study-break optimization</li>
                  <li>✔ Focus pattern intelligence</li>
                  <li>✔ Downloadable custom planner</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* FEATURES */}
          <section className="section">
            <div className="section-inner">
              <p className="section-label">Everything you need</p>
              <h2 className="section-title">
                Built for students who refuse to settle for average.
              </h2>
              <div className="features-grid">
                {features.map((f) => (
                  <article className="feat-card" data-feat key={f.title}>
                    <div className="feat-top">
                      <div className="feat-icon">{f.icon}</div>
                      <span className="feat-tag">{f.tag}</span>
                    </div>
                    <h3 className="feat-title">{f.title}</h3>
                    <p className="feat-desc">{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* NEW: Platform Intelligence Data Section */}
          <section className="intelligence-section" ref={intelligenceRef}>
            <div className="intelligence-grid">
              <div>
                <p className="section-label">Platform Intelligence</p>
                <h2 className="section-title">Enterprise‑grade scale, student‑friendly design.</h2>
                <div className="counters-grid">
                  <div className="counter-item">
                    <div className="counter-value">{Math.floor(counters.students).toLocaleString()}+</div>
                    <div className="counter-label">Active Students</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-value">{Math.floor(counters.groups).toLocaleString()}+</div>
                    <div className="counter-label">Study Groups</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-value">{counters.uptime}%</div>
                    <div className="counter-label">Uptime</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-value">{counters.rating}★</div>
                    <div className="counter-label">Avg Rating</div>
                  </div>
                </div>
              </div>
              <div className="graph-bars">
                <div className="bar" style={{ '--height': 0.8 }} />
                <div className="bar" style={{ '--height': 1.0 }} />
                <div className="bar" style={{ '--height': 0.6 }} />
                <div className="bar" style={{ '--height': 0.9 }} />
                <div className="bar" style={{ '--height': 0.7 }} />
                <div className="bar" style={{ '--height': 1.0 }} />
                <div className="bar" style={{ '--height': 0.5 }} />
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="steps-section">
            <div className="steps-wrap">
              <div className="steps-grid">
                <div className="steps-left">
                  <p className="section-label">From setup to mastery</p>
                  <h2 className="section-title">Up and running in minutes.</h2>
                  <p className="steps-desc">
                    No steep learning curve. No bloat. CampusIQ is designed to get out of your way and let you focus on what matters — learning and achieving.
                  </p>
                </div>
                <div className="steps-list">
                  {steps.map((s) => (
                    <div className="step-item" data-step key={s.n}>
                      <div className="step-left">
                        <div className="step-num">{s.n}</div>
                        <div className="step-line" />
                      </div>
                      <div className="step-content">
                        <h3 className="step-title">{s.title}</h3>
                        <p className="step-desc">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "4rem" }}>
                <div className="glow-card">
                  <h3 className="glow-card-title">Join 50,000+ students already thriving</h3>
                  <p className="glow-card-sub">The average CampusIQ student reports 40% better time management and significantly less exam stress within the first month.</p>
                  <div className="mini-stats">
                    {stats.map((s) => (
                      <div className="mini-stat" key={s.label}>
                        <div className="mini-stat-val">{s.value}</div>
                        <div className="mini-stat-lbl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Link to="/register" className="glow-card-btn">Create Free Account →</Link>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta-section">
            <div className="cta-block" data-cta>
              <p className="cta-badge">✦ &nbsp; Free to start. Always.</p>
              <h2 className="cta-title">
                The semester of your life<br />starts right now.
              </h2>
              <p className="cta-sub">
                Join thousands of students who've upgraded their academic experience. Your workspace is waiting.
              </p>
              <div className="cta-btns">
                <Link to="/register" className="btn-hero-primary">Create Free Account →</Link>
                <Link to="/login" className="btn-hero-ghost">I already have access</Link>
              </div>
            </div>
          </section>
        </main>

        <footer>
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="brand-dot" />
              CampusIQ
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} CampusIQ. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}