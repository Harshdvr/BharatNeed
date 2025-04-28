import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MapPin, Clock, Tag, IndianRupee } from 'lucide-react';
import Link from "next/link";

// Placeholder data for postings
const postings = [
  { id: 1, type: 'Need', title: 'Need Plumber for Leaky Faucet', category: 'Services', location: 'Mumbai, MH', urgency: 'Urgent', budget: 'Negotiable', description: 'Small leak under kitchen sink needs fixing ASAP.' },
  { id: 2, type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', urgency: 'Low', budget: '₹150/kg', description: 'Delicious mango and lemon pickles, made with traditional recipes.' },
  { id: 3, type: 'Need', title: 'Help with Rice Harvesting', category: 'Farming', location: 'Rural Village, UP', urgency: 'High', budget: 'Daily Wage', description: 'Need 5-6 laborers for 3 days of rice harvesting next week.' },
  { id: 4, type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', urgency: 'Medium', budget: '₹2000/month', description: 'Experienced teacher offering maths tuition for CBSE Class 10.' },
  { id: 5, type: 'Need', title: 'Part-time Graphic Designer', category: 'Jobs', location: 'Remote', urgency: 'Medium', budget: '₹15k/month', description: 'Looking for a designer for social media posts, 10-15 hours/week.' },
];

// Placeholder for category icons
const categoryIcons: { [key: string]: React.ElementType } = {
  'Services': Tag,
  'Buy/Sell': IndianRupee,
  'Farming': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343m11.314 11.314a8 8 0 01-11.314 0m5.657-5.657a3 3 0 11-5.657 0 3 3 0 015.657 0zM15.5 7.5l-4 4" /></svg>, // Placeholder leaf icon
  'Tuitions': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, // Placeholder book icon
  'Jobs': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, // Placeholder briefcase icon
  'Help': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, // Placeholder heart icon
};

const getCategoryIcon = (category: string): React.ElementType => {
  return categoryIcons[category] || Tag; // Default to Tag icon
};

export default function Home() {
  return (
    <div className="relative min-h-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Welcome to Bharat Need
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Connecting needs and offers across India. Post what you need, offer what you have.
        </p>
      </div>

      {/* Category Filters Placeholder */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {Object.keys(categoryIcons).map((category) => {
          const Icon = getCategoryIcon(category);
          return (
            <Button key={category} variant="outline" size="sm" className="gap-1">
              <Icon />
              {category}
            </Button>
          );
        })}
         <Button variant="secondary" size="sm">All Categories</Button>
      </div>

      {/* Postings Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
        {postings.map((post) => {
          const CategoryIcon = getCategoryIcon(post.category);
          return (
          <Card key={post.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                 <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                 <Badge variant={post.type === 'Need' ? 'destructive' : 'default'} className="shrink-0">
                   {post.type}
                 </Badge>
              </div>
              <CardDescription className="flex items-center gap-1 text-xs pt-1">
                 <CategoryIcon /> {post.category}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex-grow pb-3">
              <p className="line-clamp-3">{post.description}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 pt-3 text-xs border-t bg-muted/50 p-4">
               <div className="flex items-center gap-1.5 w-full">
                  <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{post.location}</span>
               </div>
               <div className="flex items-center gap-1.5 w-full">
                  <Clock className="h-3.5 w-3.5" /> Urgency: {post.urgency}
               </div>
               <div className="flex items-center gap-1.5 w-full">
                  <IndianRupee className="h-3.5 w-3.5" /> Budget: {post.budget}
               </div>
               <Button variant="link" size="sm" className="p-0 h-auto self-end mt-1">
                  View Details & Chat
               </Button>
            </CardFooter>
          </Card>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full p-0 shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground"
        aria-label="Post Your Need"
        asChild
      >
         <Link href="/post-need">
           <PlusCircle className="h-7 w-7" />
           <span className="sr-only">Post Your Need</span>
         </Link>
      </Button>
    </div>
  );
}
