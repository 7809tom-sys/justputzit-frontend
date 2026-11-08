/**
 * AccountVerify — account verification gate.
 *
 * With biometric verification switched off (see shared/verificationPolicy.ts) the
 * page shows a single GPS photo step. The WebAuthn passkey step and its stepper
 * entry stay in the code so turning BIOMETRIC_VERIFICATION_ENABLED back on restores
 * the original two-step flow.
 *
 * The GPS step uploads the photo and records the location check the verification
 * gate reads (profile.locationVerified via trpc.verification.checkGps), so a member
 * can finish verification with no biometric credential.
 */
import { Fragment, useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Fingerprint, Camera, CheckCircle, ChevronRight, Shield, MapPin, AlertCircle } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { useLocation } from "wouter";
import { extractPhotoGps, readBrowserLocation } from "@/lib/photoGps";
import {
  BIOMETRIC_VERIFICATION_ENABLED,
  getVerificationSteps,
  isAccountVerificationComplete,
  type VerificationStepKey,
} from "@shared/verificationPolicy";

type Step = VerificationStepKey;

export default function AccountVerify() {
  const [step, setStep] = useState<Step>(BIOMETRIC_VERIFICATION_ENABLED ? "biometric" : "gps");
  const [passkeyDone, setPasskeyDone] = useState(false);
  const [gpsDone, setGpsDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gpsResult, setGpsResult] = useState<{ cityVerified: boolean; verificationNote: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: verificationStatus } = trpc.passkey.verificationStatus.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  // The city saved at sign-up/onboarding. The backend falls back to the Milwaukee
  // launch metro when it is empty.
  const cityFields = profile as { city?: string | null; claimedCity?: string | null } | undefined;
  const claimedCity = cityFields?.city || cityFields?.claimedCity || "milwaukee";

  // React to verification status changes after render so the gate never navigates
  // or changes state while React is reconciling this component.
  useEffect(() => {
    if (!verificationStatus) return;
    if (verificationStatus.passkeyVerified) setPasskeyDone(true);
    if (verificationStatus.gpsPhotoVerified) setGpsDone(true);
    if (isAccountVerificationComplete(verificationStatus)) {
      navigate("/");
    } else if (verificationStatus.passkeyVerified && BIOMETRIC_VERIFICATION_ENABLED) {
      setStep("gps");
    }
  }, [verificationStatus?.passkeyVerified, verificationStatus?.gpsPhotoVerified, navigate]);

  // ── Passkey registration (only reachable while biometric verification is on) ──
  const utils = trpc.useUtils();
  const verifyRegistrationMutation = trpc.passkey.verifyRegistration.useMutation();
  const markVerifiedMutation = trpc.passkey.markVerified.useMutation();

  async function handlePasskeySetup() {
    try {
      const options = await utils.passkey.registrationOptions.fetch();
      const response = await startRegistration({ optionsJSON: options as any });
      await verifyRegistrationMutation.mutateAsync({ response });
      await markVerifiedMutation.mutateAsync();
      setPasskeyDone(true);
      toast.success("Biometric set up! Moving to step 2…");
      setStep("gps");
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Biometric setup was cancelled. Please try again.");
      } else if (err?.message?.includes("already registered") || err?.message?.includes("excludeCredentials")) {
        // Already registered — just mark verified and move on
        await markVerifiedMutation.mutateAsync();
        setPasskeyDone(true);
        setStep("gps");
      } else {
        toast.error(err?.message ?? "Biometric setup failed. Please try again.");
      }
    }
  }

  // ── GPS photo upload ──────────────────────────────────────────────────────
  const checkGpsMutation = trpc.verification.checkGps.useMutation();

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    setGpsResult(null);
    try {
      // Read the coordinates first: they are what the verification gate needs.
      // Photo EXIF is preferred; the browser position is the fallback for phones
      // and browsers that strip location metadata from the file.
      const photoGps = await extractPhotoGps(file);
      const coords = photoGps ?? (await readBrowserLocation());

      if (!coords) {
        setGpsResult({
          cityVerified: false,
          verificationNote:
            "We couldn't find a location in this photo or from your device. Turn on Location Services, then take a fresh photo and try again.",
        });
        toast.warning("Location not detected. Please retake the photo with location services on.");
        return;
      }

      const check = await checkGpsMutation.mutateAsync({
        lat: coords.lat,
        lng: coords.lng,
        claimedCity,
      });

      // Keep the photo on the profile as well; a storage failure must not stop
      // an otherwise valid location check from completing verification.
      let photoNote: string | null = null;
      try {
        const formData = new FormData();
        formData.append("photo", file);
        const resp = await apiFetch("/api/photos/upload", { method: "POST", body: formData });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          photoNote = data?.error ?? null;
        }
      } catch {
        photoNote = null;
      }

      const note = check.verified
        ? `Location confirmed in ${check.cityLabel}.`
        : `Your location looks like it is ${check.distanceKm}km from ${check.cityLabel}, so the city check didn't pass.`;

      setGpsResult({ cityVerified: check.verified, verificationNote: note });

      if (check.verified) {
        setGpsDone(true);
        void utils.passkey.verificationStatus.invalidate();
        void utils.profile.getPhotos.invalidate();
        void utils.profile.get.invalidate();
        toast.success("Location verified! Your account is now active. 🎉");
        setTimeout(() => navigate("/"), 1200);
      } else if (photoNote) {
        toast.warning("Photo couldn't be saved, and the location check didn't pass. Please try again.");
      } else {
        toast.warning("Location check didn't pass. Try again with a fresh photo taken where you are.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const allDone = BIOMETRIC_VERIFICATION_ENABLED ? passkeyDone && gpsDone : gpsDone;
  const steps = getVerificationSteps();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
          <p className="text-gray-500 text-sm">
            {BIOMETRIC_VERIFICATION_ENABLED
              ? "Just Putzit requires two quick steps to keep our community safe and authentic."
              : "Just Putzit requires one quick step to keep our community safe and authentic."}
          </p>
        </div>

        {/* Progress Steps */}
        <div className={`flex items-center gap-3 mb-8 ${steps.length === 1 ? "justify-center" : ""}`}>
          {steps.map((entry, index) => {
            const isBiometric = entry.key === "biometric";
            return (
              <Fragment key={entry.key}>
                <StepIndicator
                  number={index + 1}
                  label={entry.label}
                  icon={isBiometric ? <Fingerprint className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  done={isBiometric ? passkeyDone : gpsDone}
                  active={step === entry.key}
                />
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors ${passkeyDone ? "bg-primary" : "bg-gray-200"}`} />
                )}
              </Fragment>
            );
          })}
        </div>

        {/* Step: Passkey (hidden while biometric verification is switched off) */}
        {BIOMETRIC_VERIFICATION_ENABLED && step === "biometric" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Set Up Biometric Login</h2>
                <p className="text-xs text-gray-500">Fingerprint, Face ID, or device PIN</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Proves you're on a real device — not a bot",
                "One device = one account (prevents fakes)",
                "Faster, more secure than passwords",
                "100% free — no SMS required",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-semibold"
              onClick={handlePasskeySetup}
              disabled={verifyRegistrationMutation.isPending || markVerifiedMutation.isPending}
            >
              {verifyRegistrationMutation.isPending
                ? "Setting up…"
                : (
                  <span className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    Set Up Biometric
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Your biometric data never leaves your device. We only store a cryptographic key.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">On a PC or biometrics not available?</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 hover:text-gray-700 text-xs"
                onClick={() => { setPasskeyDone(true); setStep("gps"); }}
              >
                Skip biometric — continue to location step
              </Button>
            </div>
          </div>
        )}

        {/* Step: GPS Photo */}
        {step === "gps" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Verify Your Location</h2>
                <p className="text-xs text-gray-500">Upload a photo taken near you</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Important:</strong> Take a fresh photo right now with your phone camera (don't upload an old screenshot). Make sure Location Services are enabled in your camera app so GPS data is embedded.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Confirms you're actually in your city",
                "Prevents long-distance catfishing",
                "Photo is stored privately — only used for verification",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>

            {gpsResult && (
              <div className={`rounded-xl p-3 mb-4 border text-sm ${
                gpsResult.cityVerified
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}>
                {gpsResult.cityVerified ? "✅" : "⚠️"} {gpsResult.verificationNote}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />

            <Button
              className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 font-semibold"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || gpsDone}
            >
              {uploading ? (
                "Uploading & verifying…"
              ) : gpsDone ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verified! Redirecting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Take / Upload Photo
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              On desktop, upload any recent photo from your phone. On mobile, tap to open your camera.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">Can't upload a GPS photo right now?</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 hover:text-gray-700 text-xs"
                onClick={() => navigate("/")}
              >
                Skip for now — enter the app
              </Button>
            </div>
          </div>
        )}

        {/* Already verified state */}
        {allDone && (
          <div className="text-center mt-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-gray-900">All verified! Welcome to Just Putzit 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number, label, icon, done, active,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          done
            ? "bg-green-500 text-white"
            : active
            ? "bg-primary text-white shadow-md"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium ${active || done ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
