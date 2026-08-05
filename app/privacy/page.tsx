import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — PostingSignal",
  description: "How PostingSignal handles account, content, and connected-service data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <article>
        <Link className="legal-brand" href="/">PostingSignal</Link>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Effective August 5, 2026</p>

        <p>
          PostingSignal is a social-content planning and publishing application operated by
          Orbit Systems AI. This policy explains the information the application processes,
          why it is used, and the choices available to you.
        </p>

        <h2>Information we process</h2>
        <p>
          We process account details provided through our authentication provider, content
          you create or upload, publishing schedules, and technical information needed to
          operate and secure the service. When you connect LinkedIn, we receive your LinkedIn
          member identifier, display name, authorized permissions, and an access token.
        </p>

        <h2>How information is used</h2>
        <p>
          Information is used to authenticate you, maintain your workspace, prepare and
          publish content you explicitly approve, operate integrations, prevent abuse, and
          diagnose service problems. PostingSignal does not sell personal information.
        </p>

        <h2>LinkedIn data</h2>
        <p>
          LinkedIn access is used only for the features you authorize. PostingSignal will not
          publish to LinkedIn without your explicit confirmation. Connected access tokens are
          encrypted at rest. You may disconnect LinkedIn from PostingSignal settings, which
          disables future use of the stored connection.
        </p>

        <h2>Storage and service providers</h2>
        <p>
          PostingSignal uses service providers for authentication, application hosting,
          database storage, and file storage. These providers process information only as
          needed to supply their services and are subject to their own security and privacy
          obligations.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Information is retained while your account is active or as needed to provide the
          service, satisfy legal obligations, resolve disputes, and protect the application.
          You may disconnect integrations or request account-data deletion through the
          application settings.
        </p>

        <h2>Your choices</h2>
        <p>
          You may decline to connect LinkedIn, revoke LinkedIn access, remove locally stored
          content, or delete your PostingSignal account data. You may also revoke application
          access from your LinkedIn account settings.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy as PostingSignal changes. The effective date above will be
          updated when material revisions are published.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions may be directed to Orbit Systems AI through its associated
          LinkedIn company page.
        </p>
      </article>
    </main>
  );
}
