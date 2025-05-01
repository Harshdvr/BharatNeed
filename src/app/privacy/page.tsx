
export default function PrivacyPage() {
  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto">
       <h1>Privacy Policy</h1>
       <p>Last updated: {new Date().toLocaleDateString()}</p>
       <p>
        Your privacy matters. Here is how BharatNeed.com collects and uses your information:
       </p>
      <h2>1. What We Collect</h2>
      <ul>
        <li>Personal information (name, phone, email)</li>
        <li>Posts created by users (needs or offers)</li>
        <li>Location data (for better matching, if permitted)</li>
        <li>Usage data (clicks, views, preferences)</li>
      </ul>
      <h2>2. How We Use It</h2>
       <ul>
        <li>To connect users more efficiently</li>
        <li>To provide relevant matches and features</li>
        <li>For safety and moderation (if needed)</li>
      </ul>
       <h2>3. What We Don't Do</h2>
       <ul>
          <li>We do not sell your personal data</li>
          <li>We do not share your content with third parties without permission</li>
       </ul>
       <h2>4. Your Control</h2>
       <ul>
        <li>You can delete your account and content at any time</li>
        <li>You can control your location access via your device settings</li>
       </ul>
      <h2>5. Data Security</h2>
      <p>
        We use Firebase Authentication and secure cloud storage. However, no system is 100% safe. Use at your own risk.
      </p>
      <h2>6. Policy Updates</h2>
      <p>
        We may revise this policy as needed. Updates will be reflected here.
      </p>
    </div>
  );
}
