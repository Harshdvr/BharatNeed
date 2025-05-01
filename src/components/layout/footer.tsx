import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react'; // Import icons

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/40 pt-10 pb-6 text-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-4 mb-8">
          {/* BharatNeed Column */}
          <div className="md:col-span-1">
            <h3 className="font-semibold mb-2 text-foreground">BharatNeed</h3>
            <p className="text-muted-foreground">Connecting communities, fulfilling needs.</p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Quick Links</h3>
            <nav className="flex flex-col space-y-1">
              <Link href="/about" className="text-muted-foreground hover:text-foreground">About Us</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
              {/* <Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link> */}
              {/* <Link href="/categories" className="text-muted-foreground hover:text-foreground">Categories</Link> */}
            </nav>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Legal</h3>
            <nav className="flex flex-col space-y-1">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            </nav>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Follow Us</h3>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/share/16hzrdZFvV/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/bharatneed?igsh=bjExMmp2Z2hsd2Rs" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              {/* Add Twitter/X icon if needed */}
              {/* <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a> */}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} BharatNeed. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
