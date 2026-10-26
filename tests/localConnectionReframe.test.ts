import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../client/src");
const home = readFileSync(resolve(root, "pages/Home.tsx"), "utf8");
const onboarding = readFileSync(resolve(root, "pages/Onboarding.tsx"), "utf8");
const matches = readFileSync(resolve(root, "pages/Matches.tsx"), "utf8");
const eventProposal = readFileSync(resolve(root, "components/EventProposalDialog.tsx"), "utf8");
const gymBuddy = readFileSync(resolve(root, "pages/GymBuddy.tsx"), "utf8");
const profile = readFileSync(resolve(root, "pages/Profile.tsx"), "utf8");

describe("local-first connection product reframe", () => {
  it("makes the public value proposition about real plans rather than swipe-only chat", () => {
    expect(home).toContain("Don’t text forever.");
    expect(home).toContain("Meet somewhere real.");
    expect(home).toContain("dates, friends, activities, and workouts");
    expect(home).toContain("Independent places first");
    expect(home).toContain("Join free");
    expect(home).toContain("not a swipe machine");
  });

  it("places Sally, shared intent, local plans, and member-controlled safety in the primary journey", () => {
    expect(home).toContain("Match with intent. Then show up somewhere real.");
    expect(home).toContain("No address sharing, no pressure to meet");
    expect(home).toContain("Safety tools are visible");
    expect(home).toContain("They do not replace it.");
  });

  it("captures group type, Gym Buddy intent, and private first-meet comfort", () => {
    expect(onboarding).toContain("Who are you making plans for?");
    expect(onboarding).toContain("My family or community");
    expect(onboarding).toContain("Open to Gym Buddy");
    expect(onboarding).toContain("Your first-meet comfort");
    expect(onboarding).toContain("meetupSafetyPreference");
    expect(onboarding).toContain("gymBuddy: gymBuddyEnabled");
  });

  it("offers only source-backed local places or a public workout path after matching", () => {
    expect(matches).toContain("venueIsLocallyOwned");
    expect(matches).toContain("venueWebsite");
    expect(matches).toContain("You both chose Gym Buddy");
    expect(matches).toContain("Choose a public gym session together");
    expect(matches).toContain("Choose a public plan");
  });

  it("requires an official public handoff for a member-to-member event invitation", () => {
    expect(eventProposal).toContain("Boolean(event.externalUrl)");
    expect(eventProposal).toContain("Choose an official public event");
    expect(eventProposal).toContain("share contact information, or meet");
  });

  it("keeps Gym Buddy and partner claims reviewable instead of inventing a franchise agreement", () => {
    expect(gymBuddy).toContain("Independent and community gyms");
    expect(gymBuddy).toContain("reviewed by an administrator before it goes live");
    expect(gymBuddy).not.toContain("Crunch Fitness is Just Putzit's featured partner gym");
    expect(home).toContain("proposed changes are reviewed by an administrator before publication");
    expect(home).toContain('id: "gymbuddy",   label: "Gym Buddy"');
    expect(profile).toContain("Open to Gym Buddy");
    expect(profile).toContain("First-meet comfort");
  });
});
