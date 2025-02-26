"use client";

import { useState, useEffect } from 'react';
import { Conversation } from '@/components/messaging/ConversationList';
import { Message } from '@/components/messaging/ChatWindow';
import { ServiceNotes } from '@/types/service';
import ChatInterface from '@/components/messaging/ChatInterface';

// Mock data for testing the chat interface
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      {
        id: 'current-user',
        name: 'You',
        role: 'admin',
        isOnline: true
      },
      {
        id: 'user-1',
        name: 'John Customer',
        role: 'customer',
        avatar: '/avatars/john.jpg',
        isOnline: true
      }
    ],
    lastMessage: {
      content: 'When will my car be ready?',
      sentAt: new Date(Date.now() - 15 * 60 * 1000),
      senderId: 'user-1',
      isRead: false
    },
    unreadCount: 1,
    serviceRequestId: 'sr-1',
    type: 'direct'
  },
  {
    id: 'conv-2',
    participants: [
      {
        id: 'current-user',
        name: 'You',
        role: 'admin',
        isOnline: true
      },
      {
        id: 'user-2',
        name: 'Mike Mechanic',
        role: 'mechanic',
        avatar: '/avatars/mike.jpg',
        isOnline: false
      }
    ],
    lastMessage: {
      content: 'I fixed the alternator, waiting for parts to arrive',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      senderId: 'user-2',
      isRead: true
    },
    unreadCount: 0,
    serviceRequestId: 'sr-2',
    type: 'direct'
  },
  {
    id: 'conv-3',
    participants: [
      {
        id: 'current-user',
        name: 'You',
        role: 'admin',
        isOnline: true
      },
      {
        id: 'user-3',
        name: 'Dave Driver',
        role: 'driver',
        isOnline: true
      }
    ],
    lastMessage: {
      content: 'Vehicle picked up and on the way to the shop',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      senderId: 'user-3',
      isRead: true
    },
    unreadCount: 0,
    serviceRequestId: 'sr-3',
    type: 'direct'
  },
  {
    id: 'conv-4',
    participants: [
      {
        id: 'current-user',
        name: 'You',
        role: 'admin',
        isOnline: true
      },
      {
        id: 'user-4',
        name: 'Sarah Manager',
        role: 'shop',
        avatar: '/avatars/sarah.jpg',
        isOnline: false
      }
    ],
    lastMessage: {
      content: 'We need to discuss the new pricing structure',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      senderId: 'current-user',
      isRead: true
    },
    unreadCount: 0,
    type: 'direct'
  },
  {
    id: 'conv-5',
    participants: [
      {
        id: 'current-user',
        name: 'You',
        role: 'admin',
        isOnline: true
      },
      {
        id: 'user-1',
        name: 'John Customer',
        role: 'customer',
        avatar: '/avatars/john.jpg',
        isOnline: true
      },
      {
        id: 'user-2',
        name: 'Mike Mechanic',
        role: 'mechanic',
        avatar: '/avatars/mike.jpg',
        isOnline: false
      }
    ],
    lastMessage: {
      content: "Let's coordinate on this repair",
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      senderId: 'user-2',
      isRead: true
    },
    unreadCount: 0,
    serviceRequestId: 'sr-2',
    type: 'group'
  }
];

// Mock service notes for testing
const mockServiceNotes: Record<string, ServiceNotes[]> = {
  'sr-1': [
    {
      id: 'note-1',
      title: 'Initial Assessment',
      content: 'Vehicle has signs of wear on brake pads and rotors. Recommend replacement.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: {
        id: 'user-2',
        name: 'Mike Mechanic',
        role: 'mechanic'
      }
    }
  ],
  'sr-2': [
    {
      id: 'note-2',
      title: 'Parts Ordered',
      content: 'Ordered new alternator and drive belt. Expected to arrive in 2 days.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdBy: {
        id: 'user-2',
        name: 'Mike Mechanic',
        role: 'mechanic'
      }
    },
    {
      id: 'note-3',
      title: 'Repair Update',
      content: 'Alternator installed. Testing electrical system.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: {
        id: 'user-2',
        name: 'Mike Mechanic',
        role: 'mechanic'
      }
    }
  ]
};

// Mock available users for new conversations
const mockAvailableUsers = [
  {
    id: 'user-1',
    name: 'John Customer',
    role: 'customer' as const,
    avatar: '/avatars/john.jpg'
  },
  {
    id: 'user-2',
    name: 'Mike Mechanic',
    role: 'mechanic' as const,
    avatar: '/avatars/mike.jpg'
  },
  {
    id: 'user-3',
    name: 'Dave Driver',
    role: 'driver' as const
  },
  {
    id: 'user-4',
    name: 'Sarah Manager',
    role: 'shop' as const,
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 'user-5',
    name: 'Robert Admin',
    role: 'admin' as const
  },
  {
    id: 'user-6',
    name: 'Lisa Customer',
    role: 'customer' as const
  },
  {
    id: 'user-7',
    name: 'James Mechanic',
    role: 'mechanic' as const
  }
];

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const currentUserId = 'current-user';
  
  // Handler for sending messages
  const handleSendMessage = (conversationId: string, content: string, attachments?: File[]) => {
    console.log(`Sending message to conversation ${conversationId}:`, content);
    if (attachments) {
      console.log('With attachments:', attachments);
    }
    
    // In a real app, this would send the message to the backend
    // For now, we'll just update the UI optimistically
    
    setConversations(prev => prev.map(convo => {
      if (convo.id === conversationId) {
        return {
          ...convo,
          lastMessage: {
            content,
            sentAt: new Date(),
            senderId: currentUserId,
            isRead: false
          }
        };
      }
      return convo;
    }));
  };
  
  // Handler for marking messages as read
  const handleReadMessages = (conversationId: string) => {
    console.log(`Marking conversation ${conversationId} as read`);
    
    setConversations(prev => prev.map(convo => {
      if (convo.id === conversationId) {
        return {
          ...convo,
          unreadCount: 0,
          lastMessage: {
            ...convo.lastMessage,
            isRead: true
          }
        };
      }
      return convo;
    }));
  };
  
  // Handler for creating new conversations
  const handleCreateConversation = (participantIds: string[]) => {
    console.log('Creating new conversation with:', participantIds);
    
    // Create participants array with current user and selected users
    const participants = [
      {
        id: currentUserId,
        name: 'You',
        role: 'admin' as const,
        isOnline: true
      },
      ...participantIds.map(id => {
        const user = mockAvailableUsers.find(u => u.id === id);
        return {
          id,
          name: user?.name || 'Unknown User',
          role: user?.role || 'customer',
          avatar: user?.avatar,
          isOnline: Math.random() > 0.5
        };
      })
    ];
    
    // Create the conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants,
      lastMessage: {
        content: 'New conversation started',
        sentAt: new Date(),
        senderId: currentUserId,
        isRead: true
      },
      unreadCount: 0,
      type: participants.length > 2 ? 'group' : 'direct'
    };
    
    setConversations(prev => [newConversation, ...prev]);
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-4">Messaging</h1>
      <div className="bg-background rounded-lg border shadow-sm h-[calc(100%-4rem)]">
        <ChatInterface 
          conversations={conversations}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onReadMessages={handleReadMessages}
          onCreateConversation={handleCreateConversation}
          serviceNotes={mockServiceNotes}
          availableUsers={mockAvailableUsers}
        />
      </div>
    </div>
  );
} 