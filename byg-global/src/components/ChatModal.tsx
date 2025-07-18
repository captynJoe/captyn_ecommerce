"use client";

import { useState, useRef, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { app } from '../utils/firebase';

import { ReactNode } from "react";

interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp | ReactNode;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  productId: string;
  productTitle: string;
}

export default function ChatModal({ isOpen, onClose, sellerId, sellerName, productId, productTitle }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    setLoading(true);
    setError('');
    
    const chatId = `${auth.currentUser.uid}_${sellerId}_${productId}`;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newMessages: Message[] = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(newMessages);
        setLoading(false);
        scrollToBottom();
      },
      (error) => {
        console.error('Error listening to messages:', error);
        setError('Failed to load messages. Please try refreshing.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, sellerId, productId, auth.currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || sending) return;

    setSending(true);
    setError('');
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const chatId = `${auth.currentUser.uid}_${sellerId}_${productId}`;
      
      // Create or update chat metadata
      await setDoc(doc(db, 'chats', chatId), {
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.displayName || 'Anonymous',
        sellerId,
        sellerName,
        productId,
        productTitle,
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Add new message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
      });

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat with {sellerName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{productTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
                    message.senderId === auth.currentUser?.uid
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">{message.senderName}</p>
                  <p>{message.text}</p>
                  {message.timestamp && (
                    <p className="text-xs opacity-70 mt-1">
                      {typeof message.timestamp === 'object' && message.timestamp !== null && 'toDate' in message.timestamp && typeof (message.timestamp as any).toDate === 'function'
                        ? (message.timestamp as Timestamp).toDate().toLocaleTimeString()
                        : <>{String(message.timestamp)}</>}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          {error && (
            <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
