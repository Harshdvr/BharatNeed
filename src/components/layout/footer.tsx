import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/40 py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row">
        <p>&copy; {new Date().getFullYear()} Bharat Need. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/about" className="hover:text-foreground">About Us</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
