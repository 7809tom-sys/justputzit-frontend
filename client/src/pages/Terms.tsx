import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold">DRAFT — pending owner/legal review</p>
          <p className="mt-1 text-sm leading-relaxed">
            This Terms of Service is a draft. It is not final legal advice and must be reviewed by the Just Putzit owner and counsel before it is treated as the binding agreement.
          </p>
        </div>

        <div className="mb-12">
          <h1 className="font-display font-bold text-4xl text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Draft updated: October 29, 2026</p>
        </div>

        <div className="max-w-none space-y-8 text-foreground/90">
          <section>
            <p className="text-lg leading-relaxed">
              These terms describe how you may use Just Putzit, including the website, app, and related services. By creating an account or continuing to use Just Putzit, you agree to these terms and to the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">You must be 18 or older</h2>
            <p className="leading-relaxed">
              Just Putzit is only for people who are 18 years of age or older. By using the service you confirm that you are at least 18. We may remove an account if we learn that someone younger is using it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Meet in public</h2>
            <p className="leading-relaxed">
              Just Putzit helps people find local plans. It does not supervise, host, or guarantee any meetup. If you choose to meet someone, meet in a public place, tell a person you trust where you are going, and leave if you feel uncomfortable. The in-app report and block tools are for moderation review. They are not an emergency service. If you are in immediate danger, contact local emergency services first.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">User conduct</h2>
            <p className="mb-3 leading-relaxed">You agree to use Just Putzit lawfully and respectfully. You will not:</p>
            <ul className="list-disc space-y-2 pl-5 leading-relaxed">
              <li>Harass, threaten, stalk, or harm another person.</li>
              <li>Impersonate someone else or misrepresent an organization you do not represent.</li>
              <li>Post illegal, hateful, or sexually exploitative content.</li>
              <li>Scrape, sell, or share other members’ information.</li>
              <li>Attempt to access an account, admin tool, or private record you are not authorized to use.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Organization pages and invites</h2>
            <p className="leading-relaxed">
              A congregation, club, nonprofit, or other organization may request a page. A page becomes active only after the organization email is verified and a Just Putzit administrator approves the claim. Invite links do not enroll anyone automatically. A member opts in only by choosing to join. Organizers can see community totals, such as how many people opted in. They cannot see member names, profiles, messages, bookings, or real-time locations. Public events submitted by an organizer stay unpublished until an administrator approves them.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Account removal</h2>
            <p className="leading-relaxed">
              You may ask us to close your account by emailing support@justputzit.com. We may suspend or remove an account that breaks these terms, creates a safety risk, or is used by someone who is not allowed to use the service. Removing an account does not by itself delete records we must keep for safety, security, or legal reasons.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Limitation of liability</h2>
            <p className="leading-relaxed">
              Just Putzit is provided as available. We do not promise uninterrupted service, a particular match, or the conduct of any member, venue, gym, or organization. To the fullest extent allowed by law, Just Putzit and its owner are not liable for indirect, incidental, or consequential damages, or for injuries or disputes that arise from a meetup, event, or third-party place you choose to visit. Nothing in these terms limits liability that Wisconsin law does not allow us to limit.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Governing law</h2>
            <p className="leading-relaxed">
              These terms are governed by the laws of the State of Wisconsin, without regard to conflict-of-law rules. Courts located in Wisconsin are the venue for disputes about these terms, except where applicable law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Contact</h2>
            <p className="leading-relaxed">Questions about these terms can be sent to:</p>
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4">
              <p className="font-semibold text-foreground">Just Putzit</p>
              <p className="text-muted-foreground">Email: support@justputzit.com</p>
              <p className="text-muted-foreground">Website: www.justputzit.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
