import SabiLogo from '../components/SabiLogo';

const LAST_UPDATED = 'June 2026';

// ── Shared layout ──────────────────────────────────────────────────────────────

function LegalLayout({ title, children, altPage, altLabel }) {
  return (
    <div style={S.root}>
      <nav style={S.nav}>
        <a href="/" style={S.navBrand} onClick={e => { e.preventDefault(); window.location.hash = ''; window.location.href = '/'; }}>
          <SabiLogo size="md" />
        </a>
      </nav>

      <main style={S.main}>
        <div style={S.container}>
          <p style={S.lastUpdated}>Last updated: {LAST_UPDATED}</p>
          <h1 style={S.pageTitle}>{title}</h1>

          {children}

          <div style={S.switchLink}>
            <a href={altPage} style={S.link}>{altLabel} →</a>
          </div>
        </div>
      </main>

      <footer style={S.footer}>
        <p style={S.footerText}>© 2026 Danda · <a href="/#/terms" style={S.footerLink}>Terms</a> · <a href="/#/privacy" style={S.footerLink}>Privacy</a></p>
      </footer>
    </div>
  );
}

function H2({ children }) {
  return <h2 style={S.h2}>{children}</h2>;
}
function P({ children }) {
  return <p style={S.p}>{children}</p>;
}
function Ul({ items }) {
  return (
    <ul style={S.ul}>
      {items.map((item, i) => <li key={i} style={S.li}>{item}</li>)}
    </ul>
  );
}

// ── Terms of Service ───────────────────────────────────────────────────────────

function TermsContent() {
  return (
    <>
      <P>
        Welcome to Danda. By creating an account and using our platform, you agree to
        these Terms of Service. Please read them carefully before signing up.
      </P>

      <H2>1. About Danda</H2>
      <P>
        Danda is a booking and business management platform built for Nigerian professionals.
        We provide tools including a public booking page, earnings tracker, client management,
        service menu, gallery, and WhatsApp notifications — everything a skilled professional
        needs to run their business efficiently.
      </P>

      <H2>2. Eligibility</H2>
      <P>
        You must be at least 18 years old and legally authorised to operate a business in
        Nigeria to create a Danda account. By registering, you confirm that all information
        you provide is accurate and up to date.
      </P>

      <H2>3. Your Account</H2>
      <P>
        You are responsible for maintaining the confidentiality of your login credentials
        and for all activity that occurs under your account. Notify us immediately at{' '}
        <a href="mailto:legal@danda.ng" style={S.link}>legal@danda.ng</a> if you suspect
        unauthorised access to your account.
      </P>

      <H2>4. User Responsibilities</H2>
      <Ul items={[
        'Provide accurate and truthful information about your business, services, and pricing.',
        'Conduct yourself professionally in all interactions with clients facilitated through Danda.',
        'Keep your booking page information current and up to date.',
        'Not use Danda for any unlawful, fraudulent, or abusive purpose.',
        'Not attempt to reverse-engineer, scrape, or disrupt the Danda platform.',
      ]} />

      <H2>5. Subscription and Payment</H2>
      <P>
        Danda operates on a yearly subscription model. The current launch price is ₦14,400/year,
        payable through Paystack at the time of registration. This price is locked in for your
        first year; future renewal pricing may change and will be communicated in advance.
      </P>
      <P>
        <strong>Refund Policy:</strong> You may request a full refund within 7 days of payment
        by contacting us at <a href="mailto:legal@danda.ng" style={S.link}>legal@danda.ng</a>.
        After 7 days, subscription fees are non-refundable.
      </P>
      <P>
        <strong>Renewal:</strong> We will send reminder notifications before your plan expires
        via email and within your dashboard. Your booking page will be deactivated if you do
        not renew your subscription. We will not automatically charge you — renewal is manual.
      </P>

      <H2>6. Booking Policy</H2>
      <P>
        Danda facilitates the booking process between professionals and their clients but is
        not a party to the service agreement between them. We are not responsible for:
      </P>
      <Ul items={[
        'The quality or delivery of any service booked through your Danda page.',
        'Disputes between you and your clients.',
        'No-shows, cancellations, or refunds between professionals and clients.',
        'Any loss or damage arising from services arranged via Danda.',
      ]} />
      <P>
        All agreements about service delivery, pricing, cancellations, and refunds are
        solely between you (the professional) and your clients.
      </P>

      <H2>7. Intellectual Property</H2>
      <P>
        All content on the Danda platform (logo, design, code, copy) is owned by Sabi Software & Systems Limited.
        You retain ownership of any content you upload (photos, business descriptions, etc.)
        but grant us a licence to display it on your public booking page and in promotional
        materials for the platform.
      </P>

      <H2>8. Account Suspension and Termination</H2>
      <P>
        We reserve the right to suspend or terminate your account, with or without notice, if:
      </P>
      <Ul items={[
        'You violate these Terms of Service.',
        'You engage in fraudulent, abusive, or illegal activity.',
        'Your account is used to spam or mislead clients.',
        'Your subscription lapses and is not renewed within 30 days of expiry.',
      ]} />
      <P>
        You may cancel your account at any time by contacting us. Cancellation does not
        entitle you to a refund of any unused subscription period.
      </P>

      <H2>9. Limitation of Liability</H2>
      <P>
        To the fullest extent permitted by applicable law, Sabi Software & Systems Limited and its operators shall not
        be liable for any indirect, incidental, or consequential damages arising from your
        use of the platform, including but not limited to loss of revenue, loss of data, or
        disruption to your business.
      </P>

      <H2>10. Governing Law</H2>
      <P>
        These Terms of Service are governed by the laws of the Federal Republic of Nigeria.
        Any disputes arising from these terms shall be subject to the exclusive jurisdiction
        of the courts of Nigeria.
      </P>

      <H2>11. Changes to Terms</H2>
      <P>
        We may update these Terms from time to time. We will notify you of significant
        changes via email or an in-app notice. Your continued use of Danda after changes
        take effect constitutes your acceptance of the revised Terms.
      </P>

      <H2>12. Contact</H2>
      <P>
        For any questions about these Terms, please contact us at{' '}
        <a href="mailto:legal@danda.ng" style={S.link}>legal@danda.ng</a>.
      </P>
    </>
  );
}

// ── Privacy Policy ─────────────────────────────────────────────────────────────

function PrivacyContent() {
  return (
    <>
      <P>
        This Privacy Policy explains how Danda collects, uses, and protects your personal
        information when you use our platform. We are committed to safeguarding your privacy
        and handling your data with care.
      </P>

      <H2>1. Information We Collect</H2>
      <P>We collect the following information when you use Danda:</P>
      <Ul items={[
        'Account information: your full name, email address, and password.',
        'Business information: business name, type, address, city, state, and WhatsApp number.',
        'Booking data: client names, phone numbers, services booked, dates, and appointment notes submitted by your clients.',
        'Payment information: your subscription payment status and Paystack transaction reference (we do not store card details — these are handled by Paystack).',
        'Usage data: pages visited, features used, and actions taken within the platform (collected via PostHog analytics).',
      ]} />

      <H2>2. How We Use Your Information</H2>
      <Ul items={[
        'To create and manage your Danda account.',
        'To power your public booking page and display your business information to clients.',
        'To send you booking notifications and account-related emails.',
        'To process your subscription payment via Paystack.',
        'To improve the Danda platform based on how it is used.',
        'To contact you about your account, renewals, or important updates.',
      ]} />

      <H2>3. WhatsApp Notifications</H2>
      <P>
        When a client submits a booking through your public page, Danda opens a WhatsApp
        message on the client's device directed to your WhatsApp number with the booking
        details. This requires no third-party WhatsApp API — it uses the standard WhatsApp
        deep link. You are responsible for the WhatsApp number you provide.
      </P>

      <H2>4. Third-Party Services</H2>
      <P>Danda uses the following third-party services to operate:</P>
      <Ul items={[
        'Supabase — our backend and database provider. Your business data and booking records are stored securely on Supabase infrastructure.',
        'Paystack — our payment processor. All payment transactions are handled by Paystack under their terms and privacy policy. We do not store your card details.',
        'PostHog — our product analytics tool. We collect anonymised usage events to understand how the platform is used and to improve it.',
      ]} />
      <P>
        Each third-party provider has their own Privacy Policy governing their data
        practices. We encourage you to review them.
      </P>

      <H2>5. Data Security</H2>
      <P>
        We take the security of your data seriously. Danda uses industry-standard encryption
        (HTTPS/TLS) for all data in transit and relies on Supabase's enterprise-grade
        infrastructure for data at rest. Access to your data is restricted to you via your
        account credentials and to authorised Danda team members only where necessary for
        operations and support.
      </P>
      <P>
        While we take reasonable precautions, no system is completely secure. We cannot
        guarantee absolute security of your data.
      </P>

      <H2>6. Data Retention</H2>
      <P>
        We retain your account and business data for as long as your account is active.
        Booking data submitted by your clients is retained to power your client history
        and earnings tracking. If you close your account, we will delete your data within
        30 days of your request, subject to any legal obligations to retain it.
      </P>

      <H2>7. Your Rights</H2>
      <P>You have the right to:</P>
      <Ul items={[
        'Access the personal data we hold about you.',
        'Request correction of inaccurate information.',
        'Request deletion of your account and associated data.',
        'Object to or restrict our processing of your data.',
        'Receive a copy of your data in a portable format.',
      ]} />
      <P>
        To exercise any of these rights, email us at{' '}
        <a href="mailto:legal@danda.ng" style={S.link}>legal@danda.ng</a> with the subject
        line "Data Request". We will respond within 10 business days.
      </P>

      <H2>8. Cookies</H2>
      <P>
        Danda uses functional cookies and local storage to keep you logged in and remember
        your session. We do not use third-party advertising cookies. Our analytics provider
        (PostHog) may use cookies for session tracking, which you can opt out of by
        contacting us.
      </P>

      <H2>9. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will notify you of
        significant changes via email or an in-app notice. Your continued use of Danda
        after changes take effect means you accept the updated policy.
      </P>

      <H2>10. Contact</H2>
      <P>
        For privacy-related questions or requests, contact us at{' '}
        <a href="mailto:legal@danda.ng" style={S.link}>legal@danda.ng</a>.
      </P>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function LegalView({ page }) {
  const isTerms = page === 'terms';
  return (
    <LegalLayout
      title={isTerms ? 'Terms of Service' : 'Privacy Policy'}
      altPage={isTerms ? '/#/privacy' : '/#/terms'}
      altLabel={isTerms ? 'Privacy Policy' : 'Terms of Service'}
    >
      {isTerms ? <TermsContent /> : <PrivacyContent />}
    </LegalLayout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: '100vh',
    background: '#0A2E1A',
    fontFamily: "'DM Sans', sans-serif",
    color: '#FFFFFF',
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10,46,26,0.96)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(76,175,114,0.15)',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
  },
  navBrand: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  main: {
    padding: '48px 24px 80px',
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(122,174,144,0.6)',
    marginBottom: 12,
    letterSpacing: '0.3px',
  },
  pageTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: 500,
    color: '#FFFFFF',
    marginBottom: 32,
    lineHeight: 1.1,
  },
  h2: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontWeight: 500,
    color: '#F5C842',
    marginTop: 36,
    marginBottom: 12,
    lineHeight: 1.2,
  },
  p: {
    fontSize: 15,
    lineHeight: 1.75,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 14,
  },
  ul: {
    paddingLeft: 20,
    marginBottom: 14,
  },
  li: {
    fontSize: 15,
    lineHeight: 1.75,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 6,
  },
  link: {
    color: '#4CAF72',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
  switchLink: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid rgba(76,175,114,0.15)',
  },
  footer: {
    background: '#061A0E',
    padding: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(122,174,144,0.6)',
  },
  footerLink: {
    color: '#4CAF72',
    textDecoration: 'none',
  },
};
