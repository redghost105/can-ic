"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PaperclipIcon, Send, Smile, ChevronLeft, Plus, X, Image, File, Phone, Video } from 'lucide-react';
import ConversationList, { Conversation } from './ConversationList';
import ChatWindow, { Message } from './ChatWindow';
import { ServiceNotes } from '@/types/service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInterfaceProps {
  conversations: Conversation[];
  currentUserId: string;
  initialConversationId?: string;
  onSendMessage: (conversationId: string, content: string, attachments?: File[]) => void;
  onCreateConversation?: (participantIds: string[]) => void;
  onReadMessages?: (conversationId: string) => void;
  serviceNotes?: Record<string, ServiceNotes[]>;
  availableUsers?: {
    id: string;
    name: string;
    role: 'customer' | 'mechanic' | 'driver' | 'admin' | 'shop';
    avatar?: string;
  }[];
}

export default function ChatInterface({
  conversations,
  currentUserId,
  initialConversationId,
  onSendMessage,
  onCreateConversation,
  onReadMessages,
  serviceNotes = {},
  availableUsers = []
}: ChatInterfaceProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Responsive layout handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set initial conversation if provided
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [initialConversationId, conversations]);

  // Mock message loading - this would be replaced with real API calls in a production app
  useEffect(() => {
    // Simulate loading messages for each conversation
    const mockMessages: Record<string, Message[]> = {};
    
    conversations.forEach(convo => {
      // Generate 10-20 mock messages for each conversation
      const messageCount = Math.floor(Math.random() * 10) + 10;
      const convoMessages: Message[] = [];
      
      for (let i = 0; i < messageCount; i++) {
        const isFromCurrentUser = Math.random() > 0.5;
        const sender = isFromCurrentUser 
          ? { id: currentUserId, name: 'You' }
          : convo.participants.find(p => p.id !== currentUserId) || { id: 'unknown', name: 'Unknown User' };
        
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (messageCount - i) * 10);
        
        convoMessages.push({
          id: `msg-${convo.id}-${i}`,
          content: `This is a sample message ${i + 1} in this conversation.`,
          senderId: sender.id,
          senderName: sender.name,
          senderAvatar: isFromCurrentUser ? undefined : convo.participants.find(p => p.id === sender.id)?.avatar,
          timestamp,
          status: 'read',
        });
      }
      
      mockMessages[convo.id] = convoMessages;
    });
    
    setMessages(mockMessages);
  }, [conversations, currentUserId]);

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    
    if (isMobileView) {
      setShowConversationList(false);
    }
    
    if (onReadMessages && conversation.unreadCount > 0) {
      onReadMessages(conversation.id);
    }
  };

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (!activeConversation) return;
    
    // Call the parent component's onSendMessage function
    onSendMessage(activeConversation.id, content, attachments);
    
    // Optimistically add the message to the UI
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      senderId: currentUserId,
      senderName: 'You',
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMessage]
    }));
  };

  const handleBackButton = () => {
    setShowConversationList(true);
  };

  const handleCreateNewConversation = () => {
    if (!onCreateConversation || selectedUsers.length === 0) return;
    
    onCreateConversation(selectedUsers);
    setSelectedUsers([]);
    setNewMessageDialogOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    user.id !== currentUserId && 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-background border rounded-md overflow-hidden">
      {/* Conversations panel - hidden on mobile when viewing chat */}
      <div 
        className={`${
          isMobileView && !showConversationList ? 'hidden' : 'flex'
        } flex-col w-full md:w-80 border-r`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Messages</h2>
          {onCreateConversation && (
            <Dialog open={newMessageDialogOpen} onOpenChange={setNewMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input 
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                  />
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div 
                        key={user.id}
                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                          selectedUsers.includes(user.id) ? 'bg-muted' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'customer' ? 'bg-blue-100 text-blue-600' :
                          user.role === 'mechanic' ? 'bg-green-100 text-green-600' :
                          user.role === 'driver' ? 'bg-purple-100 text-purple-600' :
                          user.role === 'shop' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="rounded-full" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedUsers.map(userId => {
                          const user = availableUsers.find(u => u.id === userId);
                          if (!user) return null;
                          
                          return (
                            <div key={userId} className="inline-flex items-center space-x-1 bg-muted rounded-full py-1 pl-3 pr-1 text-sm">
                              <span>{user.name}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserSelection(userId);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewMessageDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateNewConversation}
                    disabled={selectedUsers.length === 0}
                  >
                    Start Conversation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <ConversationList 
          conversations={conversations}
          selectedConversationId={activeConversation?.id}
          onSelectConversation={handleSelectConversation}
        />
      </div>
      
      {/* Chat view area */}
      <div className={`
        flex-1 flex flex-col h-full
        ${isMobileView && showConversationList ? 'hidden' : 'flex'}
      `}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages[activeConversation.id] || []}
            serviceNotes={serviceNotes[activeConversation.serviceRequestId || ''] || []}
            onSendMessage={handleSendMessage}
            onBack={isMobileView ? handleBackButton : undefined}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No conversation selected</h3>
              <p className="text-muted-foreground max-w-sm">
                Select a conversation from the list or start a new conversation to begin messaging.
              </p>
              {onCreateConversation && (
                <Dialog open={newMessageDialogOpen} onOpenChange={setNewMessageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      New Conversation
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 