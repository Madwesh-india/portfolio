import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ----------------------------
// FORMATTER
// ----------------------------
function formatLogLine(line) {
  if (!line) return null;

  if (line.startsWith("madwesh@")) {
    const [prefix, ...rest] = line.split(":");
    const cmd = rest.join(":").trim();
    return (
      <>
        <span className="text-[#00ff95] font-bold">{prefix}:</span>{" "}
        <span className="text-gray-200">{cmd}</span>
      </>
    );
  }

  if (line.includes("[FATAL]")) return <span className="text-red-600 font-bold">{line}</span>;
  if (line.includes("[ERROR]")) return <span className="text-red-500">{line}</span>;
  if (line.includes("[WARN]")) return <span className="text-yellow-400">{line}</span>;
  if (line.includes("[DEBUG]")) return <span className="text-[#00ff95]">{line}</span>;
  if (line.includes("[INFO]")) return <span className="text-gray-200">{line}</span>;

  return <span className="text-gray-300">{line}</span>;
}

export default function TerminalOverlay({ onClose }) {
  // ---------------------------------------------------------
  // STATE MACHINE
  // ---------------------------------------------------------
  const [phase, setPhase] = useState("BOOT"); // BOOT → MENU → POST → EXIT
  const [bootLines, setBootLines] = useState([]);
  const [postLines, setPostLines] = useState([]);

  const options = [
    { id: "1", label: "Professional Mode" },
    { id: "2", label: "Playground Mode" },
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs
  const windowRef = useRef(null);
  const overlayRef = useRef(null);
  const textRef = useRef(null);
  const menuRef = useRef(null);
  const postRef = useRef(null);
  const bootStarted = useRef(false);

  // ---------------------------------------------------------
  // SCROLL / KEYBOARD LOCK (prevent background movement)
  // ---------------------------------------------------------
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = original);
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const stopWheel = (e) => e.stopPropagation();
    el.addEventListener("wheel", stopWheel, { passive: false });

    return () => el.removeEventListener("wheel", stopWheel);
  }, []);

  // ---------------------------------------------------------
  // STREAM LINES UTILITY
  // ---------------------------------------------------------
  const streamLines = (lines, setter, next) => {
    let idx = 0;

    const interval = setInterval(() => {
      setter((prev) => [...prev, lines[idx]]);
      idx++;

      if (idx >= lines.length) {
        clearInterval(interval);
        if (next)
          setTimeout(() => setPhase(next), 150); // smooth transition
      }
    }, 50);
  };

  // ---------------------------------------------------------
  // BOOT LOG LOADING
  // ---------------------------------------------------------
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    fetch("/logs/boot.log")
      .then((res) => res.text())
      .then((txt) => {
        const lines = txt.split("\n").filter(Boolean);
        streamLines(lines, setBootLines, "MENU");
      });
  }, []);

  // ---------------------------------------------------------
  // AUTO-SCROLL
  // ---------------------------------------------------------
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [bootLines, postLines, phase]);

  // ---------------------------------------------------------
  // MENU KEY HANDLER
  // ---------------------------------------------------------
  useEffect(() => {
    if (phase !== "MENU") return;

    const handler = (e) => {
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();

      if (e.key === "ArrowUp") {
        setSelectedIndex((prev) =>
          prev === 0 ? options.length - 1 : prev - 1
        );
      }

      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) =>
          prev === options.length - 1 ? 0 : prev + 1
        );
      }

      if (e.key === "1") setSelectedIndex(0);
      if (e.key === "2") setSelectedIndex(1);

      if (e.key === "Enter") setPhase("POST");
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]);

  // ---------------------------------------------------------
  // MENU FADE-IN ANIMATION
  // ---------------------------------------------------------
  useEffect(() => {
    if (phase === "MENU" && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [phase]);

  // ---------------------------------------------------------
  // POST SELECT LOADING
  // ---------------------------------------------------------
  useEffect(() => {
    if (phase !== "POST") return;

    const chosen = options[selectedIndex].label;
    setPostLines([`You selected: ${chosen}`]);

    fetch("/logs/post_select.log")
      .then((res) => res.text())
      .then((txt) => {
        const lines = txt.split("\n").filter(Boolean);
        streamLines(lines, setPostLines, "EXIT");
      });
  }, [phase]);

  // fade each line on arrival
  useEffect(() => {
    if (phase === "POST" && postRef.current?.lastChild) {
      gsap.fromTo(
        postRef.current.lastChild,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
    }
  }, [postLines]);

  // ---------------------------------------------------------
  // EXIT ANIMATION
  // ---------------------------------------------------------
  useEffect(() => {
    if (phase !== "EXIT") return;

    const choice = options[selectedIndex].id;

    const tl = gsap.timeline({
      onComplete: () => onClose && onClose(choice),
    });

    tl.to(windowRef.current, {
      opacity: 0,
      scale: 0.1,
      y: 300,
      duration: 1.1,
      ease: "power4.inOut",
    });

    tl.to(
      overlayRef.current,
      {
        backdropFilter: "blur(0px)",
        backgroundColor: "rgba(0,0,0,0)",
        duration: 0.9,
        ease: "power3.out",
      },
      "-=0.8"
    );
  }, [phase]);

  // ---------------------------------------------------------
  // JSX RENDER
  // ---------------------------------------------------------
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <div
        ref={windowRef}
        className="w-[95vw] h-[95vh] bg-[#000000cc] backdrop-blur-xl border border-[#1a1a1a] rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0,255,150,0.15)] flex flex-col"
      >
        {/* TITLE BAR */}
        <div className="w-full h-10 bg-[#0d0d0d]/80 border-b border-[#1a1a1a] flex items-center gap-3 px-4">
          <div className="w-3 h-3 bg-[#ff5f56] rounded-full"></div>
          <div className="w-3 h-3 bg-[#ffbd2e] rounded-full"></div>
          <div className="w-3 h-3 bg-[#27c93f] rounded-full"></div>
          <span className="text-gray-400 text-sm ml-4">Terminal — Boot Sequence</span>
        </div>

        {/* CONTENT AREA */}
        <div
          ref={textRef}
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-5 text-sm font-mono whitespace-pre-wrap text-[#00ff95]"
        >
          {/* ALWAYS SHOW BOOT LOGS */}
          {bootLines.map((l, i) => (
            <div key={`boot-${i}`}>{formatLogLine(l)}</div>
          ))}

          {/* MENU (BOOT + MENU + POST + EXIT all show menu) */}
          {(phase === "MENU" || phase === "POST" || phase === "EXIT") && (
            <div ref={menuRef} className="mt-6">
              <div className="text-white font-bold mb-1">
                ┌──────────── SELECT MODE ────────────┐
              </div>

              {options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`px-2 py-1 ${
                    selectedIndex === i
                      ? "bg-[#00ff95]/20 text-[#00ff95] font-bold rounded animate-pulse"
                      : "text-gray-300"
                  }`}
                >
                  {selectedIndex === i ? "➤ " : "  "}
                  {opt.id}) {opt.label}
                </div>
              ))}

              <div className="text-white font-bold mt-1">
                └──────────────────────────────────────┘
              </div>

              {phase === "MENU" && (
                <div className="mt-3 text-gray-200">
                  ↑/↓ to navigate · 1/2 to select · Press{" "}
                  <span className="text-[#00ff95]">Enter</span>
                </div>
              )}
            </div>
          )}

          {/* POST-SELECT LOGS */}
          {(phase === "POST" || phase === "EXIT") && (
            <div ref={postRef} className="mt-4 space-y-1">
              {postLines.map((l, i) => (
                <div key={`post-${i}`}>{formatLogLine(l)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
