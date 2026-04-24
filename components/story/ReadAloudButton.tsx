"use client";

import { useEffect, useRef, useState } from "react";

interface ReadAloudButtonProps {
  text: string;
  lang?: string;
}

/**
 * Floating button that reads the provided text aloud using SpeechSynthesis.
 * Restarts when `text` changes while playing. Stops on unmount.
 */
export function ReadAloudButton({ text, lang = "fr-FR" }: ReadAloudButtonProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // If the chapter changes while playing, restart narration with new text.
  useEffect(() => {
    if (!playing || !supported) return;
    window.speechSynthesis.cancel();
    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function speak() {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.98;
    u.pitch = 1;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    // Prefer a French voice if available.
    const voices = synth.getVoices();
    const frVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("fr"));
    if (frVoice) u.voice = frVoice;
    utteranceRef.current = u;
    synth.speak(u);
    setPlaying(true);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={playing ? stop : speak}
      aria-label={playing ? "Arrêter la lecture" : "Lire à voix haute"}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-[11px] font-medium tracking-wide text-ink/70 transition hover:border-ink/35 hover:text-ink"
    >
      <span aria-hidden className="text-[13px] leading-none">
        {playing ? "■" : "▶"}
      </span>
      <span>{playing ? "Stop" : "Écouter"}</span>
    </button>
  );
}
