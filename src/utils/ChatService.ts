// Mock Chat Service for demonstration
export const listenForMessages = (sosId: string, setMessages: (messages: any[]) => void) => {
  // Simulate real-time message listening
  const mockMessages = [
    { id: '1', senderId: 'Watcher1', message: 'Are you safe?', timestamp: new Date() },
    { id: '2', senderId: 'User123', message: 'Need help now!', timestamp: new Date() },
  ];
  
  setTimeout(() => {
    setMessages(mockMessages);
  }, 1000);

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribed from messages');
  };
};

export const sendMessage = async (sosId: string, senderId: string, message: string) => {
  console.log(`Sending message from ${senderId} in SOS ${sosId}: ${message}`);
  return Promise.resolve();
};