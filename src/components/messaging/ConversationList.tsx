"use client";

import { useState, useEffect } from 'react';
import { User, MessageSquare, MoreVertical, Search, Clock, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'customer' | 'mechanic' | 'driver' | 'admin' | 'shop';
    isOnline?: boolean;
  }[];
  lastMessage: {
    content: string;
    sentAt: Date;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  serviceRequestId?: string;
  type: 'direct' | 'group';
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  selectedConversationId
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      setFilteredConversations(
        conversations.filter(conversation =>
          conversation.participants.some(participant =>
            participant.name.toLowerCase().includes(lowerCaseSearchTerm)
          ) ||
          conversation.lastMessage.content.toLowerCase().includes(lowerCaseSearchTerm)
        )
      );
    }
  }, [searchTerm, conversations]);

  // Function to format the date in a user-friendly way
  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Function to get the other participant in direct conversations
  const getConversationTitle = (conversation: Conversation, currentUserId: string = 'current-user') => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
      return otherParticipant?.name || 'Unknown User';
    } else {
      // For group chats, could use a group name or list participants
      return `Group (${conversation.participants.length})`;
    }
  };

  // Function to get avatar for the conversation
  const getConversationAvatar = (conversation: Conversation, currentUserId: string = 'current-user') => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
      return {
        image: otherParticipant?.avatar,
        fallback: otherParticipant?.name?.charAt(0) || '?',
        role: otherParticipant?.role
      };
    } else {
      // For group chats
      return {
        image: undefined,
        fallback: '👥',
        role: 'group'
      };
    }
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No conversations found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term" : "Start a new conversation to chat"}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredConversations.map((conversation) => {
              const avatar = getConversationAvatar(conversation);
              const isSelected = conversation.id === selectedConversationId;
              
              return (
                <li
                  key={conversation.id}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer",
                    isSelected && "bg-muted"
                  )}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start p-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatar.image} alt={getConversationTitle(conversation)} />
                        <AvatarFallback>{avatar.fallback}</AvatarFallback>
                      </Avatar>
                      {conversation.participants.some(p => p.isOnline) && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                      
                      {avatar.role && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-primary text-[10px] text-primary-foreground w-4 h-4 flex items-center justify-center ring-2 ring-background">
                          {avatar.role === 'mechanic' ? 'M' : 
                           avatar.role === 'driver' ? 'D' : 
                           avatar.role === 'shop' ? 'S' : 
                           avatar.role === 'admin' ? 'A' : 'C'}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageDate(conversation.lastMessage.sentAt)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <p className={cn(
                          "text-sm truncate max-w-[180px]",
                          !conversation.lastMessage.isRead && "font-medium text-foreground",
                          conversation.lastMessage.isRead && "text-muted-foreground"
                        )}>
                          {conversation.lastMessage.content}
                        </p>
                        <div className="flex items-center gap-1">
                          {conversation.lastMessage.senderId === 'current-user' && (
                            <CheckCheck className="h-4 w-4 text-primary" />
                          )}
                          
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="rounded-full h-5 min-w-[20px] px-1.5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="p-4 border-t">
        <Button className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>
    </div>
  );
} 