
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useState, useEffect } from "react"; // Import useState and useEffect
import { handleSendMessageAction } from '@/actions/chatActions'; // Import the server action
import { useRouter } from 'next/navigation'; // Import useRouter

// Mock Data for testing chat
const mockContacts = [
  {
    id: 'chat1',
    name: "Ramesh Kumar",
    lastMessage: "Okay, I can come tomorrow morning.",
    avatar: "https://picsum.photos/seed/ramesh/40/40",
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
  },
  {
    id: 'chat2',
    name: "Priya Sharma",
    lastMessage: "Yes, the pickles are ready for pickup!",
    avatar: "https://picsum.photos/seed/priya/40/40",
    timestamp: new Date(Date.now() - 86400000 * 1), // 1 day ago
  },
    {
    id: 'chat3',
    name: "Anil Singh (Farmer)",
    lastMessage: "Thanks for the help with harvesting.",
    avatar: "https://picsum.photos/seed/anil/40/40",
    timestamp: new Date(Date.now() - 86400000 * 3), // 3 days ago
  },
];

const mockMessages = {
  chat1: [
    { id: 'm1-1', sender: 'other', text: "Hi, I need help with my leaky sink.", timestamp: new Date(Date.now() - 3600000 * 2.5) },
    { id: 'm1-2', sender: 'me', text: "I can help with that. When are you available?", timestamp: new Date(Date.now() - 3600000 * 2.2) },
    { id: 'm1-3', sender: 'other', text: "Okay, I can come tomorrow morning.", timestamp: new Date(Date.now() - 3600000 * 2) },
  ],
  chat2: [
    { id: 'm2-1', sender: 'me', text: "Are the mango pickles available?", timestamp: new Date(Date.now() - 86400000 * 1.2) },
    { id: 'm2-2', sender: 'other', text: "Yes, the pickles are ready for pickup!", timestamp: new Date(Date.now() - 86400000 * 1) },
  ],
  chat3: [
     { id: 'm3-1', sender: 'me', text: "We finished the harvesting. Thank you for the opportunity.", timestamp: new Date(Date.now() - 86400000 * 3.1) },
     { id: 'm3-2', sender: 'other', text: "Thanks for the help with harvesting.", timestamp: new Date(Date.now() - 86400000 * 3) },
  ]
};


export default function ChatPage() {
  const [loading, setLoading] = useState(false); // State for sending message
  const [contacts, setContacts] = useState(mockContacts); // Use mock contacts
  const [selectedChatId, setSelectedChatId] = useState<string | null>(mockContacts.length > 0 ? mockContacts[0].id : null); // Select first chat by default
  const [messages, setMessages] = useState<any[]>(selectedChatId ? mockMessages[selectedChatId as keyof typeof mockMessages] || [] : []); // Load messages for selected chat
  const router = useRouter(); // Initialize router

  useEffect(() => {
    // TODO: Fetch real contacts and messages based on user authentication and selectedChatId
    // Update messages when selected chat changes
    if (selectedChatId) {
      setMessages(mockMessages[selectedChatId as keyof typeof mockMessages] || []);
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);


    // Client-side form submission handler
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const formElement = event.currentTarget; // Store reference to form
        const messageText = formData.get('message') as string;

        if (!messageText?.trim()) {
            setLoading(false);
            // Optionally show a toast message
            return;
        }

        // Optimistically update UI before calling server action
        const newMessage = {
            id: `m-${Date.now()}`, // Temporary unique ID
            sender: 'me',
            text: messageText,
            timestamp: new Date(),
        };

        if (selectedChatId) {
            setMessages(prev => [...prev, newMessage]);
             // Update last message preview and sort contacts
            setContacts(prevContacts => prevContacts.map(contact =>
                contact.id === selectedChatId ? { ...contact, lastMessage: messageText, timestamp: new Date() } : contact
            ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        }
         formElement.reset(); // Reset form immediately after optimistic update

        // Call the server action from the imported file
        const result = await handleSendMessageAction(formData);

        setLoading(false); // Stop loading regardless of success/failure

        if (result?.success) {
            console.log("Message sent successfully (client confirmation).");
            // Optionally: Update the temporary message ID with the real one from the server if needed
        } else {
             console.error("Failed to send message (client):", result?.error);
             // Revert optimistic UI update or show error message
             if (selectedChatId) {
                setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
                // Potentially revert contact last message update as well or show error indicator
             }
             // TODO: Show toast message for error using useToast hook
        }
    };

    const handleViewProfile = (userId: string) => {
        console.log(`Simulating navigation to profile page for user ID: ${userId}`);
        // In a real app, if a public profile page exists at /profile/[userId]:
        // router.push(`/profile/${userId}`);
        // If only the logged-in user's profile exists at /profile:
        alert(`Profile view for user ${userId} not implemented yet.`);
    };

  const selectedContact = contacts.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
      {/* Contacts List */}
      <div className="w-1/4 border-r bg-muted/40">
        <ScrollArea className="h-full p-2">
          <h2 className="text-lg font-semibold p-2 mb-2">Chats</h2>
          <div className="space-y-1">
            {contacts.length > 0 ? contacts.map((contact) => (
              <div key={contact.id} className="flex items-center">
                {/* Button for selecting chat */}
                <Button
                  variant={selectedChatId === contact.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start h-auto py-2 px-3 text-left overflow-hidden"
                  onClick={() => setSelectedChatId(contact.id)} // Select chat on click
                >
                  <div className="flex items-center w-full">
                     {/* Make Avatar clickable */}
                    <Avatar
                        className="h-9 w-9 mr-3 cursor-pointer flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleViewProfile(contact.id); }} // Prevent button click
                    >
                      <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="user avatar" />
                      <AvatarFallback>{contact.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      {/* Make Name clickable */}
                      <p
                        className="text-sm font-medium truncate cursor-pointer hover:underline"
                         onClick={(e) => { e.stopPropagation(); handleViewProfile(contact.id); }} // Prevent button click
                      >
                        {contact.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{contact.lastMessage || 'No messages'}</p>
                    </div>
                  </div>
                </Button>
              </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center p-4">No chats yet.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col flex-1 bg-background">
        {selectedContact ? (
          <>
            {/* Chat Header - Make Avatar and Name clickable */}
            <div
                className="flex items-center p-3 border-b cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewProfile(selectedContact.id)}
             >
              <Avatar className="h-9 w-9 mr-3">
                 <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} data-ai-hint="recipient avatar" />
                 <AvatarFallback>{selectedContact.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">{selectedContact.name || 'Unknown User'}</h3>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 space-y-4">
               {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>
                            {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                    </div>
                </div>
               )) : (
                  <p className="text-sm text-muted-foreground text-center p-4">No messages in this chat yet. Start the conversation!</p>
               )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <Input
                  name="message"
                  placeholder="Type your message..."
                  className="flex-1"
                  autoComplete="off"
                  disabled={loading} // Disable input while sending
                />
                <Button type="submit" size="icon" aria-label="Send Message" disabled={loading}>
                   {loading ? <LoadingSpinner showText={false} className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {contacts.length > 0 ? "Select a chat to start messaging" : "Start a new chat"}
          </div>
        )}
      </div>
    </div>
  );
}
