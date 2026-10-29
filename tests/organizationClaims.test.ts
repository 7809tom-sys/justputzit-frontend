import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("organization claims restoration", () => {
  it("registers the live claim, verify, workspace, invite, and admin routes", () => {
    const app = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    const publicRoutes = app.split("\n").find((line) => line.includes("const PUBLIC_ROUTES")) ?? "";
    const claim = readFileSync(resolve(__dirname, "../client/src/pages/OrganizationClaim.tsx"), "utf8");
    const admin = readFileSync(resolve(__dirname, "../client/src/pages/OrganizationClaimAdmin.tsx"), "utf8");
    const directory = readFileSync(resolve(__dirname, "../client/src/components/CommunityDirectoryPanel.tsx"), "utf8");

    expect(app).toContain('path="/claim/verify" component={OrganizationClaimVerify}');
    expect(app).toContain('path="/claim" component={OrganizationClaim}');
    expect(app).toContain('path="/organization/:claimId" component={OrganizationWorkspace}');
    expect(app).toContain('path="/join/organization/:inviteCode" component={JoinOrganization}');
    expect(app).toContain('path="/admin/organization-claims" component={OrganizationClaimAdmin}');
    expect(publicRoutes).toContain('"/claim"');
    expect(publicRoutes).toContain('"/organization/"');
    expect(publicRoutes).toContain('"/join/organization/"');

    expect(claim).toContain("organizationClaims.request");
    expect(claim).toContain("organizationClaims.verifyEmail");
    expect(claim).toContain("organizationClaims.mine");
    expect(claim).toContain("organizationClaims.dashboard");
    expect(claim).toContain("organizationClaims.createInviteLink");
    expect(claim).toContain("organizationClaims.getInvite");
    expect(claim).toContain("organizationClaims.acceptInvite");
    expect(claim).toContain("organizationClaims.submitPublicEvent");
    expect(claim).toContain("confirmed: true");
    expect(claim).toContain("You see totals only.");
    expect(admin).toContain('user?.role !== "admin"');
    expect(admin).toContain("organizationClaims.reviewQueue");
    expect(admin).toContain("organizationClaims.reviewClaim");
    expect(admin).toContain("organizationClaims.reviewEvent");
    expect(directory).toContain("Claim this page");
  });
});
