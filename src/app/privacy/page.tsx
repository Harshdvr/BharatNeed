
export default function PrivacyPage() {
  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto">
       <h1>Privacy Policy</h1>
       <p>Last updated: {new Date().toLocaleDateString()}</p>
       <p>
        Bharat Need ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website BharatNeed.com and related services (the "Service").
      </p>
      <h2>1. Information We Collect</h2>
      <p>We may collect personal information that you voluntarily provide to us, such as:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number (for verification), password.</li>
        <li><strong>Profile Information:</strong> Location (city/area), profile picture (optional).</li>
        <li><strong>Posting Information:</strong> Details included in your needs/offers posts (title, description, category, budget, urgency, location).</li>
        <li><strong>Communication Data:</strong> Messages exchanged with other users via our chat feature.</li>
        <li><strong>Usage Data:</strong> Information about how you interact with the Service (IP address, browser type, pages visited, search queries - collected automatically).</li>
      </ul>
      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, operate, and maintain the Service.</li>
        <li>Create and manage your account.</li>
        <li>Display your posts to other users.</li>
        <li>Facilitate communication between users.</li>
        <li>Improve and personalize the Service.</li>
        <li>Analyze usage trends.</li>
        <li>Prevent fraud and ensure security.</li>
        <li>Comply with legal obligations.</li>
      </ul>
       <h2>3. Information Sharing and Disclosure</h2>
      <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
      <ul>
          <li><strong>With Other Users:</strong> Information in your public profile and posts is visible to other users. Chat messages are shared between the participating users.</li>
          <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services for us (e.g., hosting, analytics, authentication - like Firebase).</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities.</li>
          <li><strong>Business Transfers:</strong> If Bharat Need is involved in a merger, acquisition, or asset sale, your information may be transferred.</li>
      </ul>
       <h2>4. Data Security</h2>
      <p>
        We implement reasonable security measures to protect your information. However, no electronic transmission or storage is 100% secure.
      </p>
      <h2>5. Data Retention</h2>
      <p>
        We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this policy, or as required by law. Chat messages may be retained for a limited period to ensure service functionality and security.
      </p>
      <h2>6. Your Choices and Rights</h2>
      <p>
       You may review and update your account information. Depending on your location, you may have additional rights regarding your personal data (e.g., access, correction, deletion). Please contact us to exercise these rights.
      </p>
       <h2>7. Children's Privacy</h2>
      <p>
        The Service is not intended for children under 18. We do not knowingly collect personal information from children under 18.
      </p>
      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.
      </p>
      <h2>9. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us.
      </p>
    </div>
  );
}
