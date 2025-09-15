import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Send, 
  User,
  DollarSign,
  CheckCircle,
  Clock,
  X,
  Search,
  Phone,
  Video,
  Info,
  Star,
  MapPin,
  Shield,
  ShieldOff,
  AlertCircle
} from 'lucide-react';
import { SendOfferDialog } from './SendOfferDialog';

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  service_request_id?: string;
  offer_status?: string;
  offer_price?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  is_sender: boolean;
}

interface ConversationManagerProps {
  serviceIdFromRequest?: string | null;
  conversationIdFromRequest?: string | null;
  serviceRequestIdFromRequest?: string | null;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const ConversationManager = ({
  serviceIdFromRequest,
  conversationIdFromRequest,
  serviceRequestIdFromRequest,
  isEmbedded = false,
  onClose
}: ConversationManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [blockedBy, setBlockedBy] = useState(new Set());
  const [showSendOfferDialog, setShowSendOfferDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations();
        if (activeConversation) {
          fetchMessages(activeConversation.customer_id);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [user, activeConversation?.customer_id]);

  // If we have request-specific props, automatically find/create conversation
  useEffect(() => {
    if (serviceRequestIdFromRequest && user) {
      handleRequestSpecificChat();
    }
  }, [serviceRequestIdFromRequest, user]);

  const handleRequestSpecificChat = async () => {
    if (!serviceRequestIdFromRequest || !user) return;

    try {
      // Fetch service request via backend if needed (skipping now)
      const serviceRequest: any = null;

      if (serviceRequest) {
        // Get customer profile separately
        const { data: customerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', serviceRequest.customer_id)
          .single();

        const customerName = customerProfile 
          ? `${customerProfile.first_name} ${customerProfile.last_name}`
          : 'Customer';

        // Create or find conversation with this customer
        const conversation: Conversation = {
          id: serviceRequest.customer_id,
          customer_id: serviceRequest.customer_id,
          customer_name: customerName,
          last_message: 'Service request received',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };

        setActiveConversation(conversation);
        fetchMessages(conversation.customer_id);
      }
    } catch (error) {
      console.error('Error handling request-specific chat:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      // Get all messages where user is either sender or receiver
      const { data } = await apiClient.get('/messages/conversations');
      const items = ((data as any)?.data || []).map((c: any) => ({
        id: c.partner_id,
        customer_id: c.partner_id,
        customer_name: c.partner_name,
        last_message: c.last_message,
        last_message_time: c.last_message_time,
        unread_count: c.unread,
      }));

      setConversations(items);
      fetchBlockedStatus();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({ title: "Error", description: "Failed to fetch conversations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (customerId: string) => {
    try {
      const { data } = await apiClient.get(`/messages/conversation/${customerId}`);
      const processedMessages = ((data as any)?.data || []).map((m: any) => ({
        ...m,
        is_sender: m.sender_id === user?.id
      }));

      setMessages(processedMessages);

      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchBlockedStatus = async () => {
    try {
      const { data, error } = await apiClient.get('/blocked-conversations', { role: 'worker' });
      if (error) throw error;
      const list = (data as any[]) || [];
      setBlockedBy(new Set(list.map((b: any) => b.customer_id)));
    } catch (error) {
      console.error('Error fetching blocked status:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    // Check if blocked by customer
    if (blockedBy.has(activeConversation.customer_id)) {
      toast({
        title: "Cannot send message",
        description: "This customer has blocked messages from you.",
        variant: "destructive"
      });
      return;
    }

    // Double-check in database before sending
    // skipping remote RPC check; rely on backend to accept/reject

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add message immediately to UI
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: activeConversation.customer_id,
      message_text: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      is_sender: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { data, error } = await apiClient.post('/messages', {
        receiver_id: activeConversation.customer_id,
        message: messageText,
      });
      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...data, is_sender: true }
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText); // Restore message text
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const sendOfferInChat = async (price: number, description: string, estimatedHours: number) => {
    if (!activeConversation) return;

    try {
      // Find the service request for this conversation
      const serviceRequest: any = null;

      let serviceTitle = 'service';
      let serviceId = null;

      if (serviceRequest) {
        serviceTitle = serviceRequest.services?.title || 'service';
        serviceId = serviceRequest.service_id;

        // Create offer in offers table
        const { error: offerCreateError } = await supabase
          .from('offers')
          .insert({
            service_request_id: serviceRequest.id,
            worker_id: user?.id,
            customer_id: activeConversation.customer_id,
            service_id: serviceRequest.service_id,
            price: price,
            estimated_hours: estimatedHours,
            description: description,
            status: 'pending',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

        if (offerCreateError) throw offerCreateError;

        // Update service request with offer
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            status: 'responded',
            worker_response: JSON.stringify({
              price,
              estimated_hours: estimatedHours,
              description,
              available_dates: []
            })
          })
          .eq('id', serviceRequest.id);

        if (updateError) throw updateError;
      } else {
        // If no service request found, create offer without service_request_id
        // but still try to get service information if possible
        // TODO: create offer via backend offers endpoint if available

        if (offerCreateError) throw offerCreateError;
      }

      // Send offer message with service details
      const offerMessage = `💼 **Service Offer**

${description}

💰 **Price:** $${price}
⏰ **Estimated Time:** ${estimatedHours} hours

This is for your ${serviceTitle} request. Would you like to accept this offer? I'm ready to get started!`;

      const { error } = await apiClient.post('/messages', {
        receiver_id: activeConversation.customer_id,
        message: offerMessage,
      });

      if (error) throw error;

      fetchMessages(activeConversation.customer_id);
      fetchConversations();
      
      toast({
        title: "Offer Sent!",
        description: "Your offer has been sent to the customer.",
      });
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({ title: "Error", description: "Failed to send offer", variant: "destructive" });
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.customer_id);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Loading Conversations</h3>
            <p className="text-muted-foreground">Preparing your chat workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // If embedded mode and we have request-specific props, show simplified chat
  if (isEmbedded && serviceRequestIdFromRequest && serviceIdFromRequest) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <h3 className="text-lg font-semibold text-primary">
            Chat with {activeConversation?.customer_name || 'Customer'}
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.is_sender ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                message.is_sender 
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
              }`}>
                <p className="text-sm">{message.message_text}</p>
                <p className={`text-xs mt-2 ${
                  message.is_sender ? 'text-primary-foreground/70' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="rounded-full border-2 focus:border-primary"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💬 Message Center
              </h1>
              <p className="text-lg text-blue-700">
                Connect with customers, discuss projects, and build lasting relationships
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-700 font-medium">Online & Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Conversations</span>
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                {conversations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-4 border-b border-blue-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-400 bg-white/80"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-blue-600 font-medium">No conversations yet</p>
                  <p className="text-sm text-blue-500">Start chatting with customers to see conversations here</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-blue-100 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${
                      activeConversation?.id === conversation.id ? 'bg-blue-100/70 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 border-2 border-blue-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                          {conversation.customer_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {conversation.customer_name}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="rounded-full text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {conversation.last_message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(conversation.last_message_time).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {activeConversation && (
                  <Avatar className="w-8 h-8 border-2 border-white/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-white/20 text-white font-semibold">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span>
                  {activeConversation ? `Chat with ${activeConversation.customer_name}` : 'Select a conversation'}
                </span>
              </div>
            
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeConversation ? (
              <div className="space-y-4 h-[600px] flex flex-col">
                {/* Customer Info Bar */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-indigo-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-semibold">
                          {activeConversation.customer_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-indigo-800">{activeConversation.customer_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-indigo-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Active now</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {blockedBy.has(activeConversation.customer_id) ? (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <ShieldOff className="h-3 w-3" />
                          <span>Blocked</span>
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-700 border-green-200">
                          <Shield className="h-3 w-3" />
                          <span>Active</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-white to-gray-50/50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <MessageSquare className="h-8 w-8 text-indigo-600" />
                        </div>
                        <p className="text-indigo-600 font-medium">No messages yet</p>
                        <p className="text-sm text-indigo-500">Start the conversation with a friendly message!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.is_sender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] break-words whitespace-pre-wrap p-4 rounded-2xl border shadow-sm ${
                          message.is_sender 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.message_text}</p>
                          <div className="flex items-center justify-between mt-3 text-xs opacity-80">
                            <span className="text-xs">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.is_sender && (<CheckCircle className="h-3 w-3" />)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Send Offer Button - Only show if we have the required props */}
                {serviceIdFromRequest && serviceRequestIdFromRequest && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Ready to send an offer?</span>
                      </div>
                      <SendOfferDialog 
                        customerId={activeConversation.customer_id}
                        customerName={activeConversation.customer_name}
                        serviceId={serviceIdFromRequest}
                        serviceRequestId={serviceRequestIdFromRequest}
                      />
                    </div>
                  </div>
                )}

                {/* Message Input */}
                {blockedBy.has(activeConversation.customer_id) ? (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-t border-red-200 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">Conversation Blocked</p>
                    <p className="text-sm text-red-600">
                      This customer has blocked messages from you.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white border-t">
                    <div className="flex space-x-3">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 rounded-full"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim()}
                        className="rounded-full px-6"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-indigo-800">Select a Conversation</h3>
                    <p className="text-indigo-600">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};