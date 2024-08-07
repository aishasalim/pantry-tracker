// components/GeminiChat.js
import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { MessageSquare, ArrowUp } from "lucide-react";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

const GeminiChat = ({ addItem, deleteItem, updateItem }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the isOpen state
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = async () => {
    if (input.trim()) {
      // Add the user's message to the chat
      setMessages([...messages, { text: input, sender: 'user' }]);
  
      try {
        // Generate a response from the Gemini AI with a context-specific prompt
        const prompt = `You are a pantry assistant. Please provide concise and relevant responses about pantry-related tasks. User input: "${input}". Respond briefly.`;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
  
        // Process the response to keep it concise and relevant
        const processedText = processResponse(text);
  
        // Parse the response and execute corresponding action
        const lowerText = processedText.toLowerCase();
        const amountMatch = processedText.match(/(\d+)/);
        const amount = amountMatch ? parseInt(amountMatch[1], 10) : 1;
  
        if (lowerText.includes('add')) {
          const nameMatch = processedText.match(/add\s(.+)/i);
          if (nameMatch) {
            const name = nameMatch[1];
            await addItem({ name, amount });
          }
        } else if (lowerText.includes('delete')) {
          const nameMatch = processedText.match(/delete\s(.+)/i);
          if (nameMatch) {
            const name = nameMatch[1];
            await deleteItem(name);
          }
        } else if (lowerText.includes('update')) {
          const nameMatch = processedText.match(/update\s(.+)\sto/i);
          if (nameMatch) {
            const name = nameMatch[1];
            await updateItem(name, amount);
          }
        }
  
        // Add the AI's response to the chat
        setMessages([...messages, { text: input, sender: 'user' }, { text: processedText, sender: 'ai' }]);
      } catch (error) {
        console.error('Error generating content:', error);
        setMessages([...messages, { text: input, sender: 'user' }, { text: 'Error generating response', sender: 'ai' }]);
      }
  
      // Clear the input
      setInput('');
    }
  };
  
  // Function to process the AI response and keep it concise and relevant
  const processResponse = (text) => {
    // Simplify the AI response to make it concise and relevant to the pantry context
    const lines = text.split('\n');
    const relevantLines = lines.filter(line => line.toLowerCase().includes('add') || line.toLowerCase().includes('delete') || line.toLowerCase().includes('update'));
    return relevantLines.join(' ').split('.').slice(0, 1).join('.'); // Keep only the first relevant sentence
  };
  
  
  

  return (
    <aside
      className={`border-l transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[24em]' : 'w-18'
      }`}
    >
      <nav className="h-full flex flex-col max-h-[100vh] overflow-y-auto">
        <div className="p-2 my-1.5 flex justify-between items-center">
          <button
            onClick={toggleChat}
            className="p-3 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
          >
            <MessageSquare />
          </button>
          <h2 className={`text-lg mr-4 font-semibold ${isOpen ? '' : 'hidden'}`}>Chat Support</h2>
        </div>

        {isOpen && (
          <div className="flex-grow overflow-y-auto p-4 transition-all duration-300 ease-in-out">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 my-2 rounded-md ${
                  message.sender === 'user' ? 'bg-blue-200 self-end' : 'bg-gray-200 self-start'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="border-t p-3 flex items-center">
            <input
              className="flex-grow p-2 border rounded-lg"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                }
                }}
            />
            <button
              className="ml-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg"
              onClick={handleSend}
            >
              <ArrowUp />
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default GeminiChat;
