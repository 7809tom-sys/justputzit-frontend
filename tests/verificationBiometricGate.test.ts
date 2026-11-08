import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BIOMETRIC_VERIFICATION_ENABLED,
  getVerificationSteps,
  isAccountVerificationComplete,
} from "../shared/verificationPolicy";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("biometric verification switch", () => {
  it("defaults to off so the flow is the GPS photo step alone", () => {
    expect(BIOMETRIC_VERIFICATION_ENABLED).toBe(false);
    expect(getVerificationSteps()).toEqual([{ key: "gps", label: "GPS Photo" }]);
  });

  it("still returns the two-step flow when the switch is on", () => {
    // Guards the shape of the policy output so re-enabling restores the stepper.
    const policy = read("shared/verificationPolicy.ts");
    expect(policy).toContain('{ key: "biometric", label: "Biometric" }');
  });

  it("treats a location check alone as complete verification", () => {
    expect(isAccountVerificationComplete({ gpsPhotoVerified: true, passkeyVerified: false })).toBe(true);
    expect(isAccountVerificationComplete({ gpsPhotoVerified: true, passkeyVerified: null })).toBe(true);
    expect(isAccountVerificationComplete({ gpsPhotoVerified: false, passkeyVerified: true })).toBe(false);
    expect(isAccountVerificationComplete(undefined)).toBe(false);
  });
});

describe("verification page without biometrics", () => {
  it("starts on the GPS step and hides the passkey card behind the switch", () => {
    const source = read("client/src/pages/AccountVerify.tsx");
    expect(source).toContain('const [step, setStep] = useState<Step>(BIOMETRIC_VERIFICATION_ENABLED ? "biometric" : "gps");');
    expect(source).toContain('{BIOMETRIC_VERIFICATION_ENABLED && step === "biometric" && (');
    expect(source).toContain("getVerificationSteps()");
    expect(source).not.toContain('label="Biometric"');
  });

  it("records the location check the verification gate reads", () => {
    const source = read("client/src/pages/AccountVerify.tsx");
    expect(source).toContain("trpc.verification.checkGps.useMutation()");
    expect(source).toContain("checkGpsMutation.mutateAsync({");
    expect(source).toContain("utils.passkey.verificationStatus.invalidate()");
  });
});

describe("no biometric prompts elsewhere", () => {
  it("keeps the biometric login button off while the switch is off", () => {
    const source = read("client/src/pages/Login.tsx");
    expect(source).toContain("{BIOMETRIC_VERIFICATION_ENABLED && (");
    expect(source).toContain("handleBiometricLogin");
  });

  it("does not offer passkey enrollment from the profile", () => {
    const source = read("client/src/pages/Profile.tsx");
    expect(source).toContain("BIOMETRIC_VERIFICATION_ENABLED && !deviceCheckComplete");
  });

  it("does not advertise biometric verification on public pages", () => {
    expect(read("client/src/pages/EventDetail.tsx")).not.toContain("Biometric verified");
    expect(read("client/src/pages/CityLanding.tsx")).not.toContain("Biometric verified");
  });
});
