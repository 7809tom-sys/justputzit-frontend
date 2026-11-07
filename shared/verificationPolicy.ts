/**
 * Account verification policy.
 *
 * BIOMETRIC_VERIFICATION_ENABLED is the single switch for the WebAuthn passkey
 * ("biometric") step. While it is off, every member verifies with the GPS photo /
 * location step only: no biometric prompt during sign-up or login, no biometric
 * step in the verification stepper, and no passkey upsell in the profile.
 *
 * The WebAuthn implementation is deliberately kept in place; flipping this
 * constant back to true restores the two-step flow, the biometric login button,
 * and the optional passkey enrollment in the profile.
 */
export const BIOMETRIC_VERIFICATION_ENABLED = false;

export type VerificationStepKey = "biometric" | "gps";

export type VerificationStep = {
  key: VerificationStepKey;
  /** Label shown in the verification stepper. */
  label: string;
};

/** Steps the verification page shows, in order. */
export function getVerificationSteps(): VerificationStep[] {
  const gps: VerificationStep = { key: "gps", label: "GPS Photo" };
  if (!BIOMETRIC_VERIFICATION_ENABLED) return [gps];
  return [{ key: "biometric", label: "Biometric" }, gps];
}

export type VerificationState = {
  passkeyVerified?: boolean | null;
  gpsPhotoVerified?: boolean | null;
};

/**
 * Whether the account has finished verification. The passkey result only counts
 * while biometric verification is switched on, so accounts can complete the flow
 * with a location check alone.
 */
export function isAccountVerificationComplete(state: VerificationState | null | undefined): boolean {
  if (!state?.gpsPhotoVerified) return false;
  if (!BIOMETRIC_VERIFICATION_ENABLED) return true;
  return state.passkeyVerified === true;
}
