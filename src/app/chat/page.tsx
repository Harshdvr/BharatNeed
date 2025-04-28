import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

// Placeholder data
const contacts = [
  { id: 1, name: "Ramesh Kumar", lastMessage: "Okay, see you then.", avatar: "https://picsum.photos/id/101/50/50" },
  { id: 2, name: "Priya Sharma", lastMessage: "Thanks for the help!", avatar: "https://picsum.photos/id/102/50/50" },
  { id: 3, name: "Farm Supplies Co.", lastMessage: "Delivery scheduled for Tuesday.", avatar: "https://picsum.photos/id/103/50/50" },
];

const messages = [
    { id: 1, sender: 'other', text: "Hi! I saw your post about needing a plumber.", timestamp: "10:30 AM" },
    { id: 2, sender: 'me', text: "Yes, the kitchen sink is leaking.", timestamp: "10:31 AM" },
    { id: 3, sender: 'other', text: "I can come take a look this afternoon around 3 PM. Does that work?", timestamp: "10:32 AM" },
    { id: 4, sender: 'me', text: "Yes, 3 PM is perfect. Thank you!", timestamp: "10:33 AM" },
     { id: 5, sender: 'other', text: "Great, see you then!", timestamp: "10:34 AM" },
];

export default function ChatPage() {
  // TODO: Implement actual chat logic: contact selection, message fetching, sending messages via Server Action/WebSocket

  const selectedContact = contacts[0]; // Placeholder: Assume first contact is selected

   const handleSendMessage = async (formData: FormData) => {
        'use server';
        const message = formData.get('message');
        if (!message || typeof message !== 'string' || message.trim() === '') return;

        console.log("Sending message:", message);
        // Add logic to save message to Firestore and potentially notify recipient
        // Clear input field (client-side)
   };

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden"> {/* Adjust height as needed */}
      {/* Contacts List */}
      <div className="w-1/4 border-r bg-muted/40">
        <ScrollArea className="h-full p-2">
          <h2 className="text-lg font-semibold p-2 mb-2">Chats</h2>
          <div className="space-y-1">
            {contacts.map((contact) => (
              <Button
                key={contact.id}
                variant={selectedContact?.id === contact.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-2 px-3"
              >
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col flex-1">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center p-3 border-b">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">{selectedContact.name}</h3>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 space-y-4">
               {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>{msg.timestamp}</p>
                    </div>
                </div>
               ))}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <form action={handleSendMessage} className="flex items-center gap-2">
                <Input
                  name="message"
                  placeholder="Type your message..."
                  className="flex-1"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" aria-label="Send Message">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
