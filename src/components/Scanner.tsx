"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  RefreshCw,
  User,
  Mail,
  Phone,
  Clock,
  Lock,
  Unlock,
  Eye,
  X,
  ExternalLink,
  Users,
  FileText,
  UserCheck,
} from "lucide-react";
import { playSuccessChime, playWarningBuzzer, playErrorBeep } from "@/lib/audio";
import { Ticket } from "@/types";
import { DEFAULT_MARSHALS, GateMarshal } from "@/lib/constants";

function normalizeIdCardUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }

  // Already standard HTTP URL or relative API route
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Decode URL-encoded data URI
  let decoded = trimmed;
  if (trimmed.startsWith("data%3A") || trimmed.includes("%2C")) {
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      decoded = trimmed;
    }
  }

  // Data URL format: ensure no spaces instead of +, and strip line breaks
  if (decoded.startsWith("data:image/")) {
    const commaIdx = decoded.indexOf(",");
    if (commaIdx !== -1) {
      const header = decoded.slice(0, commaIdx + 1);
      const data = decoded.slice(commaIdx + 1).replace(/\s+/g, "+");
      return header + data;
    }
    return decoded;
  }

  // Raw base64 string without data: prefix
  if (
    decoded.startsWith("/9j/") ||
    decoded.startsWith("iVBORw0") ||
    decoded.startsWith("UklGR") ||
    decoded.length > 50
  ) {
    const cleanData = decoded.replace(/\s+/g, "+");
    return `data:image/jpeg;base64,${cleanData}`;
  }

  return decoded;
}

type ScanResultState = {
  status: "Valid" | "Used" | "Invalid" | "Error" | null;
  message: string;
  ticket?: Ticket;
  timestamp?: string;
};

export default function Scanner() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [currentMarshal, setCurrentMarshal] = useState<GateMarshal>(DEFAULT_MARSHALS[0]);
  const [marshalsList, setMarshalsList] = useState<Array<GateMarshal & { scannedCount?: number }>>(DEFAULT_MARSHALS);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"marshals" | "logs">("marshals");
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [scanResult, setScanResult] = useState<ScanResultState>({
    status: null,
    message: "",
  });

  const [zoomedIdCard, setZoomedIdCard] = useState<string | null>(null);
  const [idImageError, setIdImageError] = useState(false);
  const [manualTicketId, setManualTicketId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Persistent stats initialized from database
  const [stats, setStats] = useState({
    validCount: 0,
    alreadyUsedCount: 0,
    invalidCount: 0,
  });

  const scannerRef = useRef<any>(null);
  const scanLockRef = useRef(false);
  const scannerContainerId = "qr-reader-container";

  // Fetch live persistent tallies, marshals and scan logs from database
  const fetchLiveStats = async () => {
    try {
      setIsRefreshingStats(true);
      const res = await fetch("/api/scanner-stats");
      const data = await res.json();
      if (data && data.success) {
        if (data.stats) {
          setStats({
            validCount: data.stats.validCount || 0,
            alreadyUsedCount: data.stats.alreadyUsedCount || 0,
            invalidCount: data.stats.invalidCount || 0,
          });
        }
        if (data.marshals && Array.isArray(data.marshals)) {
          setMarshalsList(data.marshals);
        }
        if (data.recentScans && Array.isArray(data.recentScans)) {
          setRecentScans(data.recentScans);
        }
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.warn("Could not fetch live scanner stats:", err);
    } finally {
      setIsRefreshingStats(false);
    }
  };

  // Restore Gate Marshal login session from localStorage so refresh keeps them logged in
  useEffect(() => {
    const savedUnlock = localStorage.getItem("taalsya_scanner_unlocked");
    const savedPin = localStorage.getItem("taalsya_marshal_pin");
    const savedName = localStorage.getItem("taalsya_marshal_name");

    if (savedUnlock === "true") {
      setIsUnlocked(true);
      if (savedPin) {
        const found = DEFAULT_MARSHALS.find((m) => m.pin === savedPin) || {
          id: "custom",
          name: savedName || "Gate Marshal",
          pin: savedPin,
          gate: "Gate Terminal",
        };
        setCurrentMarshal(found);
      }
    }

    fetchLiveStats();
  }, []);

  // Poll database stats every 15s so all marshals see live progress across all 4 gates
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      fetchLiveStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  const handleUnlockPin = (e?: React.FormEvent, directPin?: string) => {
    if (e) e.preventDefault();
    const pinToTest = (directPin || pinInput).trim();
    
    const adminPin = process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || DEFAULT_MARSHALS.find((m) => m.id === "admin")?.pin || "6028";
    const matched =
      marshalsList.find((m) => m.pin === pinToTest) ||
      DEFAULT_MARSHALS.find((m) => m.pin === pinToTest) ||
      (pinToTest === adminPin
        ? { id: "admin", name: "Lead Supervisor", pin: pinToTest, gate: "All Gates (Supervisor)" }
        : null);

    if (matched) {
      const active = matched;
      setCurrentMarshal(active);
      setIsUnlocked(true);
      localStorage.setItem("taalsya_scanner_unlocked", "true");
      localStorage.setItem("taalsya_marshal_pin", pinToTest);
      localStorage.setItem("taalsya_marshal_name", active.name);
      setPinError(false);
      fetchLiveStats();
    } else {
      setPinError(true);
      if (soundEnabled) playErrorBeep();
    }
  };

  const handleSwitchMarshal = () => {
    localStorage.removeItem("taalsya_scanner_unlocked");
    localStorage.removeItem("taalsya_marshal_pin");
    localStorage.removeItem("taalsya_marshal_name");
    setIsUnlocked(false);
    setPinInput("");
  };

  // Initialize html5-qrcode
  useEffect(() => {
    if (!isUnlocked) return;

    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        // Get available camera devices
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            if (!selectedCameraId) {
              const backCamera = devices.find((d) =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("rear") ||
                d.label.toLowerCase().includes("environment")
              );
              setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
            }
          }
        } catch (deviceErr) {
          console.warn("Could not list video input devices:", deviceErr);
        }

        html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const cameraIdOrConfig = selectedCameraId
          ? selectedCameraId
          : { facingMode };

        await html5QrCode.start(
          cameraIdOrConfig,
          config,
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage: string) => {
            // Ignore frame-by-frame non-matching noise
          }
        );

        setScannerActive(true);
        setCameraError(null);
      } catch (err: any) {
        console.error("Camera startup error:", err);
        setCameraError(
          err.message ||
            "Unable to access camera. Please allow camera permissions in your mobile browser settings."
        );
        setScannerActive(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch((err: any) => console.warn("Cleanup stop error:", err));
      }
    };
  }, [isUnlocked, facingMode, selectedCameraId]);

  // Handle scanned ticket verification
  const handleScanSuccess = async (rawCode: string) => {
    // If locked or already showing a result modal, ignore all subsequent video frames
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setIsProcessing(true);

    // Immediately pause camera decoding to stop continuous scanning
    try {
      if (scannerRef.current && typeof scannerRef.current.pause === "function") {
        scannerRef.current.pause(true);
      }
    } catch (pauseErr) {
      console.warn("Could not pause camera decoding:", pauseErr);
    }

    // Extract ticket identifier
    let ticketId = rawCode.trim();
    if (ticketId.includes("data=")) {
      const match = ticketId.match(/data=([^&]+)/);
      if (match && match[1]) {
        ticketId = decodeURIComponent(match[1]);
      }
    } else if (ticketId.includes("/")) {
      const parts = ticketId.split("/");
      ticketId = parts[parts.length - 1];
    }

    await verifyTicketId(ticketId);
  };

  const verifyTicketId = async (ticketId: string) => {
    setIsProcessing(true);
    setIdImageError(false);

    try {
      const response = await fetch("/api/verify-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          pin: currentMarshal?.pin || "6028",
          marshalName: currentMarshal?.name || "Gate Marshal",
        }),
      });

      const data = await response.json();
      const status = data.status as "Valid" | "Used" | "Invalid" | "Error";

      // Refresh live persistent tallies from Supabase right after scan
      setTimeout(() => fetchLiveStats(), 500);

      if (status === "Valid") {
        if (soundEnabled) playSuccessChime();
        setStats((prev) => ({ ...prev, validCount: prev.validCount + 1 }));
        setScanResult({
          status: "Valid",
          message: data.message || "Entry Approved! Ticket is valid.",
          ticket: data.ticket,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (status === "Used") {
        if (soundEnabled) playWarningBuzzer();
        setStats((prev) => ({
          ...prev,
          alreadyUsedCount: prev.alreadyUsedCount + 1,
        }));
        setScanResult({
          status: "Used",
          message: data.message || "Already Scanned! This ticket was redeemed.",
          ticket: data.ticket,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        if (soundEnabled) playErrorBeep();
        setStats((prev) => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
        setScanResult({
          status: "Invalid",
          message: data.message || "Invalid Ticket! Record not found.",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      if (soundEnabled) playErrorBeep();
      setScanResult({
        status: "Error",
        message: err.message || "Network error communicating with gate server.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeScanning = () => {
    // Clear previous modal
    setScanResult({ status: null, message: "" });
    setZoomedIdCard(null);
    setIdImageError(false);
    setIsProcessing(false);

    // Resume camera scanning
    try {
      if (scannerRef.current && typeof scannerRef.current.resume === "function") {
        scannerRef.current.resume();
      }
    } catch (resumeErr) {
      console.warn("Could not resume camera scanning:", resumeErr);
    }

    // Safety cooldown so pulling the phone away doesn't immediately re-scan
    setTimeout(() => {
      scanLockRef.current = false;
    }, 700);
  };

  const handleOpenFullImage = () => {
    const norm = normalizeIdCardUrl(zoomedIdCard);
    const ticketId = scanResult.ticket?.ticketId;

    // 1. If ticketId is available, open the clean server route which serves genuine binary image headers
    if (ticketId) {
      window.open(`/api/ticket/${encodeURIComponent(ticketId)}/id-card`, "_blank");
      return;
    }

    // 2. If norm is already an HTTP / HTTPS or relative path, navigate directly
    if (norm && (norm.startsWith("http://") || norm.startsWith("https://") || norm.startsWith("/"))) {
      window.open(norm, "_blank");
      return;
    }

    // 3. If norm is a data: URI, convert to a Blob URL so browser won't block top-frame navigation
    if (norm && norm.startsWith("data:")) {
      try {
        const parts = norm.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const cleanB64 = (parts[1] || "").replace(/\s+/g, "+");
        const bstr = atob(cleanB64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        return;
      } catch (err) {
        console.error("Failed to convert data URI to blob URL:", err);
      }
    }
  };

  const toggleCameraFacing = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setSelectedCameraId("");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Staff PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shadow-xl shadow-indigo-500/20">
              <img
                src="/logo.png"
                alt="Taalasya"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-slate-900 shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Entry Gate Terminal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your Gate Marshal station or enter your 4-digit PIN.
            </p>
          </div>

          {/* Quick Marshal Station Selectors */}
          <div className="grid grid-cols-2 gap-2 text-left">
            {(marshalsList.length > 0 ? marshalsList : DEFAULT_MARSHALS).filter((m) => m.id !== "admin").map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleUnlockPin(undefined, m.pin)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                    {m.name}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    {m.pin}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.gate}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-3 pt-2">
            <div>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                autoFocus
                placeholder="Or enter 4-digit PIN..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="w-full text-center tracking-[0.5em] text-xl font-mono py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">
                  Invalid PIN. Please select your station above or check with supervisor.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Scanner</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 pt-1">
            Supervisor Admin PIN:{" "}
            <button
              type="button"
              onClick={() => handleUnlockPin(undefined, DEFAULT_MARSHALS.find((m) => m.id === "admin")?.pin || "6028")}
              className="font-mono text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              {DEFAULT_MARSHALS.find((m) => m.id === "admin")?.pin || "6028"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Active Marshal Station Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 text-[11px] shrink-0">Terminal:</span>
          <span className="font-bold text-white truncate">
            {currentMarshal.name}
          </span>
          <span className="text-[10px] text-indigo-300 font-mono hidden sm:inline truncate">
            ({currentMarshal.gate})
          </span>
        </div>

        <button
          onClick={handleSwitchMarshal}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-200 underline cursor-pointer shrink-0 ml-2"
        >
          Switch PIN
        </button>
      </div>

      {/* Top Header & Live Counter Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-indigo-500 shrink-0 shadow-sm">
            <img
              src="/logo.png"
              alt="Taalasya Logo"
              className="w-full h-full rounded-full object-cover bg-white"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Gate Checkpoint Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Taalasya Gate Marshal Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Camera Flip */}
          <button
            onClick={toggleCameraFacing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Switch Front / Back Camera"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Flip</span>
          </button>
        </div>
      </div>

      {/* Session Counter Badges */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Admitted
          </p>
          <p className="text-xl font-black text-emerald-300 font-mono">
            {stats.validCount}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Duplicate
          </p>
          <p className="text-xl font-black text-amber-300 font-mono">
            {stats.alreadyUsedCount}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Invalid
          </p>
          <p className="text-xl font-black text-rose-300 font-mono">
            {stats.invalidCount}
          </p>
        </div>
      </div>

      {/* Camera Viewport Container */}
      <div className="relative rounded-3xl bg-black border border-slate-800 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
        {/* html5-qrcode target div */}
        <div
          id={scannerContainerId}
          className="w-full h-full object-cover rounded-3xl overflow-hidden"
        />

        {/* Viewfinder Target Reticle */}
        {!scanResult.status && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-indigo-500/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br" />
            </div>
            <div className="absolute bottom-6 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-white/90">
              Align Attendee QR Inside Box
            </div>
          </div>
        )}

        {/* Camera Permission or Initialization Error */}
        {cameraError && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-rose-300">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        )}

        {/* FULLSCREEN POPUP: STATUS == 'Valid' (BIG GREEN CHECK) */}
        {scanResult.status === "Valid" && (
          <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-between text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex justify-end">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                {scanResult.timestamp}
              </span>
            </div>

            <div className="space-y-3">
              <div className="w-24 h-24 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-bounce">
                <CheckCircle2 className="w-16 h-16 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  ENTRY APPROVED
                </h3>
                <p className="text-sm font-semibold text-emerald-300 mt-1">
                  Ticket Valid • Status Updated to &apos;Used&apos;
                </p>
              </div>

              {scanResult.ticket && (
                <div className="mt-3 p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 text-left text-xs space-y-2 max-w-xs mx-auto text-emerald-100">
                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    <User className="w-4 h-4 text-emerald-300" />
                    <span>{scanResult.ticket.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-200">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">{scanResult.ticket.email}</span>
                  </div>
                  {scanResult.ticket.phone && (
                    <div className="flex items-center gap-1.5 text-emerald-200">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{scanResult.ticket.phone}</span>
                    </div>
                  )}

                  {/* Namaste BHU ID Cross-Verification for Gate Security */}
                  {(() => {
                    const validIdUrl = normalizeIdCardUrl(scanResult.ticket?.idCardUrl);
                    if (!validIdUrl) {
                      return (
                        <div className="pt-1.5 border-t border-emerald-800/80">
                          <p className="text-[10px] text-emerald-400/70 italic">
                            No Namaste BHU ID card attached for this pass.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="pt-2 border-t border-emerald-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Namaste BHU ID Card:
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomedIdCard(validIdUrl)}
                            className="text-[10px] text-emerald-300 hover:text-white underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Tap to Zoom</span>
                          </button>
                        </div>

                        {!idImageError ? (
                          <div
                            onClick={() => setZoomedIdCard(validIdUrl)}
                            className="relative w-full h-28 rounded-xl overflow-hidden border border-emerald-500/40 cursor-pointer group bg-black/60 shadow-inner"
                            title="Click to zoom student ID card"
                          >
                            <img
                              src={validIdUrl}
                              alt="Namaste BHU ID Card"
                              onError={() => setIdImageError(true)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Zoom Full ID</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/20 text-center space-y-1.5">
                            <p className="text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              Namaste BHU ID Attached
                            </p>
                            <button
                              type="button"
                              onClick={() => setZoomedIdCard(validIdUrl)}
                              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Attached ID</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <p className="font-mono text-[10px] text-emerald-300/80 pt-1 border-t border-emerald-800">
                    Pass: {scanResult.ticket.ticketId.slice(0, 16)}...
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={resumeScanning}
              autoFocus
              className="w-full py-4 px-6 rounded-2xl font-black text-base text-emerald-950 bg-white hover:bg-emerald-50 active:scale-95 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Scan Next Pass</span>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FULLSCREEN POPUP: STATUS == 'Used' (BIG RED ALERT) */}
        {scanResult.status === "Used" && (
          <div className="absolute inset-0 bg-rose-950/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-between text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex justify-end">
              <span className="text-[10px] font-mono text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded">
                {scanResult.timestamp}
              </span>
            </div>

            <div className="space-y-3">
              <div className="w-24 h-24 rounded-full bg-rose-600 text-white mx-auto flex items-center justify-center shadow-2xl shadow-rose-600/50 animate-pulse">
                <AlertTriangle className="w-16 h-16 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  ALREADY SCANNED!
                </h3>
                <p className="text-sm font-semibold text-rose-300 mt-1">
                  Access Denied • Pass Was Previously Redeemed
                </p>
              </div>

              {scanResult.ticket && (
                <div className="mt-3 p-3.5 rounded-2xl bg-rose-900/40 border border-rose-500/30 text-left text-xs space-y-2 max-w-xs mx-auto text-rose-100">
                  <p className="font-bold text-white text-sm">
                    Owner: {scanResult.ticket.name}
                  </p>
                  <p className="text-rose-200">
                    Email: {scanResult.ticket.email}
                  </p>

                  {(() => {
                    const validIdUrl = normalizeIdCardUrl(scanResult.ticket?.idCardUrl);
                    if (!validIdUrl) return null;
                    return (
                      <div className="pt-2 border-t border-rose-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-rose-300">
                          <span>Namaste BHU ID:</span>
                          <button
                            type="button"
                            onClick={() => setZoomedIdCard(validIdUrl)}
                            className="text-[10px] text-rose-300 hover:text-white underline cursor-pointer"
                          >
                            Tap to Zoom
                          </button>
                        </div>
                        <div
                          onClick={() => setZoomedIdCard(validIdUrl)}
                          className="relative w-full h-20 rounded-xl overflow-hidden border border-rose-500/40 cursor-pointer group bg-black/60"
                        >
                          <img
                            src={validIdUrl}
                            alt="Namaste BHU ID"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-rose-300/90 text-[11px] flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    Status: Marked as Used
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={resumeScanning}
              autoFocus
              className="w-full py-4 px-6 rounded-2xl font-black text-base text-white bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Dismiss & Scan Next</span>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FULLSCREEN POPUP: STATUS == 'Invalid' or 'Error' */}
        {(scanResult.status === "Invalid" || scanResult.status === "Error") && (
          <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-between text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex justify-end">
              <span className="text-[10px] font-mono text-red-400 bg-red-900/60 px-2 py-0.5 rounded">
                {scanResult.timestamp || "Alert"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-600 text-white mx-auto flex items-center justify-center shadow-xl">
                <XCircle className="w-14 h-14 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {scanResult.status === "Error" ? "SYSTEM NOTICE" : "INVALID TICKET"}
                </h3>
                <p className="text-xs text-red-300 mt-2 max-w-xs mx-auto leading-relaxed">
                  {scanResult.message || "This QR code is not recognized in the event registration database."}
                </p>
              </div>
            </div>

            <button
              onClick={resumeScanning}
              autoFocus
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-red-800 hover:bg-red-700 active:scale-95 shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Scan Next Pass</span>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Code Entry Alternative */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <button
          onClick={() => setShowManualInput((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            Manual Ticket ID Lookup (Torn / Broken Screens)
          </span>
          <span className="text-[10px] text-indigo-400">
            {showManualInput ? "Hide" : "Show"}
          </span>
        </button>

        {showManualInput && (
          <div className="pt-2 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualTicketId.trim()) {
                  verifyTicketId(manualTicketId.trim());
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Enter short code (e.g. 7K2M or JHM-7K2M)..."
                value={manualTicketId}
                onChange={(e) => setManualTicketId(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualTicketId.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Verify
              </button>
            </form>
            <p className="text-[11px] text-slate-500 px-1">
              Tip: Volunteers can enter just the 4-char suffix (e.g. <span className="text-indigo-400 font-mono">7K2M</span>) or full code (<span className="text-indigo-400 font-mono">JHM-7K2M</span>).
            </p>
          </div>
        )}
      </div>

      {/* 4 Gate Marshals & Live Scan Audit Log Tables */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("marshals")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "marshals"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>4 Gate Marshals</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Live Scans ({recentScans.length})</span>
            </button>
          </div>

          <button
            onClick={fetchLiveStats}
            disabled={isRefreshingStats}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Refresh database tallies"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshingStats ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Tab 1: 4 Gate Marshals Overview Table */}
        {activeTab === "marshals" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Turnstile Staff Stations</span>
              {lastSyncedTime && (
                <span className="text-[10px] text-slate-500 font-mono">Synced: {lastSyncedTime}</span>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Marshal</th>
                    <th className="py-2.5 px-2">PIN</th>
                    <th className="py-2.5 px-3">Station</th>
                    <th className="py-2.5 px-3 text-right">Admitted</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {marshalsList.map((m) => {
                    const isCurrent = currentMarshal.pin === m.pin;
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-900/40 transition-colors ${
                          isCurrent ? "bg-indigo-950/30" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                          <span>{m.name}</span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-indigo-300">
                          {m.pin}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                          {m.gate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {m.scannedCount || 0}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Active Station" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Each marshal logs in with their 4-digit PIN. Counts persist in Supabase across browser reloads.
            </p>
          </div>
        )}

        {/* Tab 2: Live Passes Scanned Audit Trail */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Live Turnstile Admission Stream</span>
              <span className="text-[10px] text-slate-500 font-mono">Last 50 Scans</span>
            </div>

            {recentScans.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                No tickets scanned yet. Scans from all 4 marshals will stream here live.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {recentScans.map((scan, i) => {
                  const isSuccess = scan.scanStatus === "Valid";
                  const isUsed = scan.scanStatus === "Already Used" || scan.scanStatus === "Used";
                  return (
                    <div
                      key={scan.id || i}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white tracking-wide">
                            {scan.ticketId}
                          </span>
                          <span className="text-slate-400 truncate max-w-[130px]">
                            • {scan.attendeeName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          By <span className="text-indigo-300 font-semibold">{scan.marshalName}</span> •{" "}
                          {new Date(scan.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isUsed
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {scan.scanStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Screen Zoom Lightbox Modal for Gate Marshal Verification */}
      {zoomedIdCard && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedIdCard(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Namaste BHU ID Verification
              </span>
              <button
                type="button"
                onClick={() => setZoomedIdCard(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              onClick={handleOpenFullImage}
              className="mt-4 w-full max-h-[72vh] overflow-auto rounded-2xl bg-black/80 flex items-center justify-center p-2 border border-slate-800 cursor-pointer group"
              title="Click to view full image in new tab"
            >
              {normalizeIdCardUrl(zoomedIdCard) ? (
                <img
                  src={normalizeIdCardUrl(zoomedIdCard)!}
                  alt="Namaste BHU ID Card Full Preview"
                  className="max-h-[66vh] w-auto object-contain rounded-xl shadow-lg group-hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ID card image data unavailable.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between w-full pt-3">
              <p className="text-xs text-slate-400 text-center flex-1">
                Cross-verify student name, photo, and roll number with attendee at gate.
              </p>
              <button
                type="button"
                onClick={handleOpenFullImage}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 inline-flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Full</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
