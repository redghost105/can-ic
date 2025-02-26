"use client";

import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Image, X, FileText, ChevronLeft, Phone, Video, MoreVertical, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Conversation } from './ConversationList';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    type: 'image' | 'document';
    url: string;
    name: string;
    size?: string;
    thumbnailUrl?: string;
  }[];
}

interface ServiceNotes {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  serviceNotes?: ServiceNotes[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onBack?: () => void;
  currentUserId: string;
}

export default function ChatWindow({
  conversation,
  messages,
  serviceNotes = [],
  onSendMessage,
  onBack,
  currentUserId
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== '' || attachments.length > 0) {
      onSendMessage(newMessage, attachments);
      setNewMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getOtherParticipants = () => {
    return conversation.participants.filter(p => p.id !== currentUserId);
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = format(message.timestamp, 'MMM d, yyyy');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center">
            {conversation.type === 'direct' ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={getOtherParticipants()[0]?.avatar} />
                <AvatarFallback>{getOtherParticipants()[0]?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback>👥</AvatarFallback>
              </Avatar>
            )}
            
            <div className="ml-3">
              <h3 className="text-sm font-medium">
                {conversation.type === 'direct'
                  ? getOtherParticipants()[0]?.name
                  : `Group (${conversation.participants.length})`}
              </h3>
              
              {conversation.type === 'direct' && getOtherParticipants()[0]?.isOnline && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block mr-1.5"></span>
                  Online
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add user</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 border-b rounded-none">
          <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">Service Notes</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
        </TabsList>

        {/* Chat Messages */}
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 data-[state=active]:flex-1">
          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} className="mb-6">
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-muted"></div>
                  <span className="flex-shrink mx-4 text-xs text-muted-foreground">{date}</span>
                  <div className="flex-grow border-t border-muted"></div>
                </div>
                
                {msgs.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUserId;
                  const showAvatar = index === 0 || msgs[index - 1]?.senderId !== message.senderId;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex mb-4",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isCurrentUser && showAvatar && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback>{message.senderName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      {!isCurrentUser && !showAvatar && <div className="w-10"></div>}
                      
                      <div className={cn(
                        "max-w-[70%] flex flex-col",
                        isCurrentUser && "items-end"
                      )}>
                        {showAvatar && !isCurrentUser && (
                          <span className="text-xs text-muted-foreground mb-1">{message.senderName}</span>
                        )}
                        
                        <div className={cn(
                          "rounded-lg p-3",
                          isCurrentUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map(attachment => (
                                <div key={attachment.id}>
                                  {attachment.type === 'image' ? (
                                    <div className="relative rounded-md overflow-hidden">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-full h-auto"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center p-2 rounded-md bg-background/50">
                                      <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                                        {attachment.size && (
                                          <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-1 text-xs text-muted-foreground gap-1">
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {isCurrentUser && (
                            <span className="text-xs">
                              {message.status === 'read' ? 'Read' : message.status === 'delivered' ? 'Delivered' : 'Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="px-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="relative inline-block">
                    <div className="relative border rounded-md p-2 bg-muted">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {file.type.startsWith('image/') ? (
                        <div className="h-20 w-20 relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-full w-full object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center p-2">
                          <FileText className="h-5 w-5 mr-2" />
                          <div>
                            <p className="text-xs font-medium truncate max-w-[100px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-muted rounded-lg border">
                <Input
                  placeholder="Type a message..."
                  className="min-h-[40px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                
                <div className="flex justify-between items-center px-3 py-2 border-t">
                  <div className="flex items-center gap-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={triggerFileInput}>
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={triggerFileInput}>
                            <Image className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                size="icon"
                onClick={handleSendMessage}
                disabled={newMessage.trim() === '' && attachments.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Service Notes */}
        <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 data-[state=active]:flex-1">
          {serviceNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No service notes</h3>
              <p className="text-sm text-muted-foreground">
                Service notes related to this conversation will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceNotes.map(note => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{note.title}</h4>
                    <Badge variant="outline">
                      {note.createdBy.role.charAt(0).toUpperCase() + note.createdBy.role.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">{note.content}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>By {note.createdBy.name}</span>
                    <span>{format(note.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="flex-1 overflow-y-auto p-4 data-[state=active]:flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {messages
              .flatMap(msg => msg.attachments || [])
              .filter(attachment => attachment !== undefined)
              .map(attachment => (
                <div 
                  key={attachment.id} 
                  className="border rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-colors"
                >
                  {attachment.type === 'image' ? (
                    <div>
                      <div className="aspect-square w-full relative overflow-hidden">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.size} • {format(new Date(), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex items-center mb-2">
                        <FileText className="h-6 w-6 mr-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                        </div>
                      </div>
                      {attachment.size && (
                        <p className="text-xs text-muted-foreground mt-auto">
                          {attachment.size} • {format(new Date(), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            
            {messages.flatMap(msg => msg.attachments || []).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-40 text-center p-4">
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No documents</h3>
                <p className="text-sm text-muted-foreground">
                  Documents and images shared in this conversation will appear here
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 