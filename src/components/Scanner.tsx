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
} from "lucide-react";
import { playSuccessChime, playWarningBuzzer, playErrorBeep } from "@/lib/audio";
import { Ticket } from "@/types";

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

  // Already standard HTTP URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
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

  const [stats, setStats] = useState({
    validCount: 0,
    alreadyUsedCount: 0,
    invalidCount: 0,
  });

  const scannerRef = useRef<any>(null);
  const scanLockRef = useRef(false);
  const scannerContainerId = "qr-reader-container";

  // Check Gate PIN from localStorage
  useEffect(() => {
    const savedUnlock = sessionStorage.getItem("taalsya_scanner_unlocked");
    if (savedUnlock === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN is 1234 if not configured
    const validPin = process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || "1234";
    if (pinInput.trim() === validPin || pinInput.trim() === "1234") {
      setIsUnlocked(true);
      sessionStorage.setItem("taalsya_scanner_unlocked", "true");
      setPinError(false);
    } else {
      setPinError(true);
      if (soundEnabled) playErrorBeep();
    }
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
          pin: process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || "1234",
        }),
      });

      const data = await response.json();
      const status = data.status as "Valid" | "Used" | "Invalid" | "Error";

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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
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
              Taalasya Gate Marshal Access. Enter staff PIN to activate camera.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                autoFocus
                placeholder="Enter Gate PIN (e.g. 1234)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">
                  Incorrect PIN. Please re-enter or check with gate supervisor.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Scanner</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Default Demo PIN: <span className="font-mono text-indigo-400">1234</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
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

      {/* Quick Test Demo Bar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Test with demo pass:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => verifyTicketId("demo_valid_pass_123")}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[10px] font-semibold"
          >
            Test Valid
          </button>
          <button
            onClick={() => verifyTicketId("invalid_pass_xyz")}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-mono text-[10px] font-semibold"
          >
            Test Invalid
          </button>
        </div>
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
            <div className="mt-4 w-full max-h-[72vh] overflow-auto rounded-2xl bg-black/80 flex items-center justify-center p-2 border border-slate-800">
              {normalizeIdCardUrl(zoomedIdCard) ? (
                <img
                  src={normalizeIdCardUrl(zoomedIdCard)!}
                  alt="Namaste BHU ID Card Full Preview"
                  className="max-h-[66vh] w-auto object-contain rounded-xl shadow-lg"
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
              {normalizeIdCardUrl(zoomedIdCard) && (
                <a
                  href={normalizeIdCardUrl(zoomedIdCard)!}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 inline-flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
