"use client";

import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(
  () => import('@/components/chatbot/chatbot-widget').then(m => m.ChatbotWidget),
  { ssr: false }
);

export function ChatbotDynamic() {
  return <ChatbotWidget />;
}
