
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

// TODO: Remove placeholder data and fetch actual chat contacts and messages
const contacts: any[] = [
  // Example Structure (replace with fetched data)
  // { id: 1, name: "Fetched User 1", lastMessage: "...", avatar: "..." },
  // { id: 2, name: "Fetched User 2", lastMessage: "...", avatar: "..." },
];

const messages: any[] = [
    // Example Structure (replace with fetched data for selected chat)
    // { id: 1, sender: 'other', text: "...", timestamp: "..." },
    // { id: 2, sender: 'me', text: "...", timestamp: "..." },
];

export default function ChatPage() {
  // TODO: Implement actual chat logic: contact selection, message fetching, sending messages via Server Action/WebSocket
  // TODO: Add loading state for fetching contacts and messages

  const selectedContact = contacts.length > 0 ? contacts[0] : null; // Placeholder: Assume first contact is selected if available

   const handleSendMessage = async (formData: FormData) => {
        'use server';
        // TODO: Set loading true
        const message = formData.get('message');
        if (!message || typeof message !== 'string' || message.trim() === '') return;

        console.log("Sending message:", message);
        // Add logic to save message to Firestore and potentially notify recipient
        // Clear input field (client-side)
        // TODO: Set loading false after completion/error
   };

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
      {/* Contacts List */}
      {/* TODO: Add loading state for contacts list */}
      <div className="w-1/4 border-r bg-muted/40">
        <ScrollArea className="h-full p-2">
          <h2 className="text-lg font-semibold p-2 mb-2">Chats</h2>
          <div className="space-y-1">
            {contacts.length > 0 ? contacts.map((contact) => (
              <Button
                key={contact.id}
                variant={selectedContact?.id === contact.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-2 px-3"
                // TODO: Add onClick handler to select the chat
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
            )) : (
                <p className="text-sm text-muted-foreground text-center p-4">No chats yet.</p>
            )}
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
            {/* TODO: Add loading state for fetching messages */}
            <ScrollArea className="flex-1 p-4 space-y-4">
               {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>{msg.timestamp}</p>
                    </div>
                </div>
               )) : (
                  <p className="text-sm text-muted-foreground text-center p-4">No messages in this chat yet.</p>
               )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <form action={handleSendMessage} className="flex items-center gap-2">
                <Input
                  name="message"
                  placeholder="Type your message..."
                  className="flex-1"
                  autoComplete="off"
                  // TODO: Disable input while sending
                />
                {/* TODO: Disable button when loading */}
                <Button type="submit" size="icon" aria-label="Send Message">
                  <Send className="h-5 w-5" />
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
