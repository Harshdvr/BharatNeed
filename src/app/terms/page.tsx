
export default function TermsPage() {
  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto">
       <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Welcome to BharatNeed.com. By using this platform, you agree to the following terms:
      </p>
      <h2>1. Platform Purpose</h2>
      <p>
        BharatNeed is a peer-to-peer (P2P) platform. We simply provide a space for users to post needs and offers. We are not involved in any deals, and we do not act as intermediaries or mediators.
      </p>
      <h2>2. No Guarantees or Vetting</h2>
      <p>
        We do not verify or guarantee any user content, service, or post. Users are responsible for doing their own due diligence before engaging with others.
      </p>
       <h2>3. User Conduct</h2>
      <p>Users agree not to:</p>
      <ul>
        <li>Post false, illegal, or harmful content</li>
        <li>Harass, scam, or impersonate others</li>
        <li>Use bots or automation to interact with the platform</li>
      </ul>
      <h2>4. Zero Liability for Transactions</h2>
      <p>
        BharatNeed does not take responsibility for any deals, payments, losses, or scams. All transactions are at your own risk.
      </p>
      <h2>5. Communication Tools</h2>
      <p>
        Messaging is provided solely for direct peer-to-peer communication. We do not monitor private messages unless required by law.
      </p>
       <h2>6. Automatic Deletion of Posts and Chats</h2>
      <ul>
        <li>All posts will be automatically deleted after 30 days from the date of posting.</li>
        <li>Chats will be automatically deleted after 7 days of inactivity.</li>
      </ul>
      <h2>7. Account Suspension</h2>
      <p>
        We may suspend or delete accounts that post harmful, illegal, or inappropriate content.
      </p>
      <h2>8. Changes to Terms</h2>
      <p>
        These terms may change. Continued use implies acceptance of the latest version.
      </p>
    </div>
  );
}
