import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Camera, RefreshCw, Zap, CheckCircle2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import type { CommunityEvent, Participant } from '@/types/event';
import type { Member } from '@/types/member';

interface QrAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CommunityEvent;
  members: Member[];
  participants: Participant[];
  onCheckInMember: (memberId: string) => Promise<void> | void;
}

export const QrAttendanceScannerModal: React.FC<QrAttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  event,
  members,
  participants,
  onCheckInMember,
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lastScannedMember, setLastScannedMember] = useState<{ name: string; time: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastTicketRef = useRef<string>('');

  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  const handleQrPayload = async (decodedText: string) => {
    const now = Date.now();
    // Prevent duplicate triggers within 2.5 seconds for the identical ticket
    if (decodedText === lastTicketRef.current && now - lastScanTimeRef.current < 2500) {
      return;
    }

    lastScanTimeRef.current = now;
    lastTicketRef.current = decodedText;
    setScanError(null);

    // Expected format: mfc_ticket:{eventId}:{memberId}
    const parts = decodedText.trim().split(':');
    if (parts[0] !== 'mfc_ticket' || parts.length < 3) {
      setScanError('Unrecognized QR Code format. Please scan an official MFC Youth digital ticket.');
      return;
    }

    const ticketEventId = parts[1];
    const ticketMemberId = parts[2];

    if (ticketEventId !== 'all' && ticketEventId !== event.id) {
      setScanError(`Ticket is registered for a different gathering (ID: ${ticketEventId.substring(0, 8)}).`);
      return;
    }

    const matchedMember = members.find((m) => m.id === ticketMemberId);
    const memberName = matchedMember
      ? [matchedMember.first_name, matchedMember.middle_name, matchedMember.last_name].filter(Boolean).join(' ')
      : `Member ${ticketMemberId.substring(0, 8)}`;

    const alreadyCheckedIn = participants.some((p) => p.member_id === ticketMemberId && p.attended);
    if (alreadyCheckedIn) {
      playBeep();
      setLastScannedMember({
        name: `${memberName} (Already Checked In)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      return;
    }

    try {
      await onCheckInMember(ticketMemberId);
      playBeep();
      setLastScannedMember({
        name: memberName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch {
      setScanError(`Unable to record check-in for ${memberName}. Please try again.`);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
          setIsCameraActive(false);
        });
      }
      return;
    }

    let isMounted = true;
    const scannerId = 'mfc-qr-reader-container';

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              void handleQrPayload(decodedText);
            }
          },
          () => {
            // Frame scanned with no code found - silent
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
          // Check for torch capability
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities() as { torch?: boolean };
            setTorchSupported(Boolean(capabilities?.torch));
          } catch {
            setTorchSupported(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsCameraActive(false);
          setScanError('Unable to access camera. Please verify camera permissions in your browser.');
        }
      }
    };

    const timer = setTimeout(() => {
      void startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
          setIsCameraActive(false);
        });
      }
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
      setIsCameraActive(false);
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextState);
    } catch {
      setTorchSupported(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check-In Scanner"
      description={`Scan member passes for ${event.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Scanner Viewport */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md aspect-square flex items-center justify-center">
          <div id="mfc-qr-reader-container" className="w-full h-full" />

          {/* Scanner Overlay Sight Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
            </div>
          </div>

          {!isCameraActive && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
              <Camera className="w-10 h-10 text-slate-400 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-slate-200">Starting video stream...</p>
              <p className="text-xs text-slate-400 mt-1">Please allow camera permissions if prompted</p>
            </div>
          )}
        </div>

        {/* Camera Control Bar */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={toggleCameraFacing}
              className="min-h-[44px] flex items-center gap-1.5 text-xs"
              title="Switch between front and back camera"
            >
              <RefreshCw className="w-4 h-4 text-navy" />
              <span>{facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
            </Button>

            {torchSupported && (
              <Button
                type="button"
                variant={isTorchOn ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleTorch}
                className="min-h-[44px] flex items-center gap-1.5 text-xs"
                title="Toggle camera flashlight"
              >
                <Zap className={`w-4 h-4 ${isTorchOn ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                <span>{isTorchOn ? 'Torch On' : 'Torch Off'}</span>
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-navy hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute check-in beep' : 'Enable check-in beep'}
            aria-label={soundEnabled ? 'Mute check-in beep' : 'Enable check-in beep'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-navy" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Scan Status / Confirmation Banner */}
        {lastScannedMember && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-950 truncate">Checked In Successfully</p>
              <p className="text-xs text-emerald-800 truncate font-semibold">{lastScannedMember.name}</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 shrink-0">{lastScannedMember.time}</span>
          </div>
        )}

        {scanError && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="font-medium">{scanError}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="min-h-[44px] px-6">
            Done Scanning
          </Button>
        </div>
      </div>
    </Modal>
  );
};
