import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  User, 
  DollarSign, 
  Clock, 
  MapPin, 
  Shield, 
  ShieldOff,
  MessageSquare,
  Search,
  Phone,
  Video,
  Info,
  Star,
  CheckCircle,
  AlertCircle,
  Heart,
  Calendar
} from 'lucide-react';

export const MessageCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [offerDialog, setOfferDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [blockedConversations, setBlockedConversations] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlockedConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await apiClient.get('/blocked-conversations', { role: 'customer' });

      if (error) throw error;
      setBlockedConversations(new Set(((data as any[]) || []).map((b: any) => b.worker_id)));
    } catch (error) {
      console.error('Error fetching blocked conversations:', error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await apiClient.get('/messages/conversations');
      if (error) throw error;
      const items = ((data as any)?.data || []).map((c: any) => ({
        id: c.partner_id,
        name: c.partner_name,
        lastMessage: c.last_message,
        lastMessageTime: c.last_message_time,
        unread: c.unread,
      }));
      setConversations(items);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation: any) => {
    setActiveConversation(conversation);
    try {
      const { data } = await apiClient.get(`/messages/conversation/${conversation.id}`);
      const list = (data as any)?.data || [];
      setMessages(list);
    } catch (e) {
      console.error('Error loading conversation:', e);
    }
  };

  const markMessagesAsRead = async (unreadMessages: any[]) => {
    if (unreadMessages.length === 0) return;

    try {
      const { error } = await apiClient.put('/messages/mark-read-batch', { ids: unreadMessages.map(m => m.id) });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const toggleBlockConversation = async (workerId: string) => {
    if (!user) return;

    const isBlocked = blockedConversations.has(workerId);
    
    try {
      if (isBlocked) {
        // Unblock
        const { error } = await apiClient.delete(`/blocked-conversations/${workerId}`);

        if (error) throw error;

        setBlockedConversations(prev => {
          const newSet = new Set(prev);
          newSet.delete(workerId);
          return newSet;
        });

        toast({
          title: "Conversation unblocked",
          description: "You can now receive messages from this worker."
        });
      } else {
        // Block
        const { error } = await apiClient.post('/blocked-conversations', { worker_id: workerId });

        if (error) throw error;

        setBlockedConversations(prev => new Set(prev).add(workerId));

        toast({
          title: "Conversation blocked",
          description: "You will no longer receive messages from this worker."
        });
      }
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    // Check if conversation is blocked
    if (blockedConversations.has(activeConversation.id)) {
      toast({
        title: "Cannot send message",
        description: "This conversation is blocked. Unblock to send messages.",
        variant: "destructive"
      });
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add message immediately to UI
    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeConversation.id,
      message_text: messageText,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { data, error } = await apiClient.post('/messages', {
        receiver_id: activeConversation.id,
        message: messageText,
      });

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? data : msg
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

  const handleViewOffer = (message: any) => {
    try {
      const offerData = JSON.parse(message.message_text);
      setSelectedOffer({...offerData, messageId: message.id});
      setOfferDialog(true);
    } catch (error) {
      console.error('Error parsing offer:', error);
      toast({
        title: "Error",
        description: "Invalid offer format",
        variant: "destructive"
      });
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer || !user) return;

    try {
      // Calculate commission and worker payout
      const commissionRate = 0.15; // 15%
      const totalAmount = selectedOffer.price;
      const commissionAmount = totalAmount * commissionRate;
      const workerPayout = totalAmount - commissionAmount;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          worker_id: selectedOffer.workerId,
          service_id: selectedOffer.serviceId,
          total_amount: totalAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          worker_payout: workerPayout,
          scheduled_date: selectedOffer.timeline || new Date().toISOString(),
          address: selectedOffer.location || 'To be determined',
          notes: selectedOffer.description || '',
          status: 'pending_payment'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Decline other pending requests for the same service
      await supabase
        .from('service_requests')
        .update({ status: 'declined' })
        .eq('service_id', selectedOffer.serviceId)
        .eq('customer_id', user.id)
        .neq('worker_id', selectedOffer.workerId);

      // Proceed to checkout
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          bookingId: booking.id,
          returnUrl: window.location.origin
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData.url) {
        window.open(checkoutData.url, '_blank');
        setOfferDialog(false);
        toast({
          title: "Success",
          description: "Offer accepted! Complete payment to confirm booking."
        });
      }

    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchBlockedConversations();
      
      // Set up real-time subscription for new messages
      const interval = setInterval(() => {
        fetchConversations();
        if (activeConversation) {
          // fetch latest conversation messages if needed
          apiClient.get(`/messages/conversation/${activeConversation.id}`).then(({ data }) => {
            if (data && Array.isArray(data.data)) {
              setMessages(data.data);
            }
          });
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [user, activeConversation?.id]);

  const isOfferMessage = (messageText: string) => {
    try {
      const parsed = JSON.parse(messageText);
      return parsed.type === 'offer' && parsed.price && parsed.workerId;
    } catch {
      return false;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h3 className="text-lg font-semibold text-primary">Loading Messages</h3>
            <p className="text-muted-foreground">Preparing your chat workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl bg-white border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">💬 Message Center</h1>
              <p className="text-sm text-muted-foreground">Connect with skilled workers, discuss projects, and get the best service</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-pink-700 font-medium">Ready to Chat</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 bg-white border border-border shadow-sm">
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Conversations</span>
              <Badge className="ml-auto">
                {conversations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No conversations yet</p>
                  <p className="text-sm text-muted-foreground">Start chatting with workers to see conversations here</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-accent ${
                      activeConversation?.id === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar  className="w-10 bg-white border-2 border-white h-10">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {conversation.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {conversation.name}
                          </h4>
                          {conversation.unread > 0 && (
                            <Badge variant="destructive" className="rounded-full text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(conversation.lastMessageTime).toLocaleDateString()}</span>
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
        <Card className="lg:col-span-2 bg-white border border-border shadow-sm">
          <CardHeader className="bg-muted rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {activeConversation && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {activeConversation.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span>
                  {activeConversation ? `Chat with ${activeConversation.name}` : 'Select a conversation'}
                </span>
              </div>
         
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeConversation ? (
              <div className="space-y-4 h-[600px] flex flex-col">
                {/* Worker Info Bar */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {activeConversation.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-foreground">{activeConversation.name}</h4>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Active now</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {blockedConversations.has(activeConversation.id) ? (
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive" className="flex items-center space-x-1">
                            <ShieldOff className="h-3 w-3" />
                            <span>Blocked</span>
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleBlockConversation(activeConversation.id)}
                            className="text-xs"
                          >
                            Unblock Chat
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-700 border-green-200">
                            <Shield className="h-3 w-3" />
                            <span>Active</span>
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleBlockConversation(activeConversation.id)}
                            className="text-xs"
                          >
                            Block Chat with {activeConversation.name?.split(' ')[0] || 'User'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium">No messages yet</p>
                        <p className="text-sm text-muted-foreground">Start the conversation with a friendly message!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] break-words whitespace-pre-wrap ${message.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                          {isOfferMessage(message.message_text) ? (
                            <div className={`p-4 rounded-2xl border shadow-sm ${
                              message.sender_id === user.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">
                                  Service Offer
                                </Badge>
                                {message.sender_id !== user.id && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewOffer(message)}
                                    className="text-xs"
                                  >
                                    View Offer
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm font-medium">
                                New service offer received
                              </p>
                            </div>
                          ) : (
                            <div className={`p-4 rounded-2xl border shadow-sm ${
                              message.sender_id === user.id
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
                                {message.sender_id === user.id && (<CheckCircle className="h-3 w-3" />)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 bg-white border-t">
                  {blockedConversations.has(activeConversation.id) ? (
                    <div className="text-center py-4">
                      <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        This conversation is blocked. Click "Unblock" above to send messages.
                      </p>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-10 w-10 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-purple-800">Select a Conversation</h3>
                    <p className="text-purple-600">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offer Dialog */}
      <Dialog open={offerDialog} onOpenChange={setOfferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Service Offer</DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 text-green-800">{selectedOffer.serviceTitle}</h3>
                <p className="text-sm text-green-700 mb-3">{selectedOffer.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Price:</span>
                    </div>
                    <span className="font-semibold text-green-800">${selectedOffer.price}</span>
                  </div>
                  
                  {selectedOffer.timeline && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">Timeline:</span>
                      </div>
                      <span className="text-sm text-green-700">{selectedOffer.timeline}</span>
                    </div>
                  )}
                  
                  {selectedOffer.location && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">Location:</span>
                      </div>
                      <span className="text-sm text-green-700">{selectedOffer.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setOfferDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAcceptOffer}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  Accept & Book
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
