import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowUp, LayoutDashboard, Camera } from 'lucide-react';

const ChatBot = ({ userId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 600);
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false); // State for video capture
  const [videoStream, setVideoStream] = useState(null);  // State to hold the video stream
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);  // Ref for video element

  // Function to toggle the isOpen state
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  // Function to handle screen size change
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to the bottom when messages are updated
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing effect for assistant responses
  const typeMessage = async (message, delay = 20) => {
    let typedText = '';
    setIsTyping(true);

    for (const char of message) {
      typedText += char;
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { sender: 'assistant', text: typedText },
      ]);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsTyping(false);
  };

  // Handle sending user messages and receiving AI responses
  const handleSend = async () => {
    if (!input.trim()) return; // Prevent sending empty messages

    // Add the user's message to the chat
    const newMessage = { sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');

    try {
      // Map messages to correct roles expected by Together AI
      const formattedMessages = messages.map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

      // Include the new message being sent
      formattedMessages.push({ role: 'user', content: newMessage.text });

      // Send the formatted messages to the backend API to get the AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages,
          inventory: [], // Include inventory if needed; otherwise, leave as an empty array
          userId: userId, // Pass the userId as a prop
        }),
      });

      // Check if the response is okay
      if (!response.ok) {
        throw new Error('Failed to fetch response from server');
      }

      const data = await response.json();

      // Check if data has an error key and handle accordingly
      if (data.error) {
        throw new Error(data.error);
      }

      // Assuming the response is a plain text message
      const aiMessage = typeof data === 'string' ? data : data.content || 'Unexpected response format';

      // Add an empty message to show typing animation
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'assistant', text: '' },
      ]);

      // Simulate typing effect
      await typeMessage(aiMessage);
    } catch (error) {
      console.error('Error fetching AI response:', error);

      // Display the error message in the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'assistant', text: error.message || 'Error fetching response. Please try again.' },
      ]);
    }
  };

  // Function to start video capture
  const handleStartVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      setIsVideoOpen(true);
      
      // Use useEffect to ensure videoRef is set correctly
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing webcam: ', err);
    }
  };

  // Function to stop video capture
  const handleStopVideo = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsVideoOpen(false);
  };

  return isSmallScreen ? (
    // On small screens, display chat as a full-screen modal when opened
    <div
      className={`fixed bottom-0 right-0 w-full bg-white shadow-md ${
        isOpen ? 'h-full' : 'h-12 w-12'}`}
    >
      {!isOpen && (
        <button onClick={toggleChat} className="p-3 rounded-full bg-gray-100 hover:bg-gray-150 absolute bottom-2 right-4">
          <MessageSquare />
        </button>
      )}

      {!isOpen && (
      <button 
        onClick={() => window.location.href = '/dashboard'}  
        className="p-3 rounded-full bg-gray-100 hover:bg-gray-150 absolute bottom-2 right-[5em]">
        <LayoutDashboard />
      </button>
      )}

      {!isOpen && (
      <button 
        onClick={handleStartVideo}  
        className="p-3 rounded-full bg-gray-100 hover:bg-gray-150 absolute bottom-2 right-[9em]">
        <Camera />
      </button>
      )}

      {isOpen && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Chat Support</h2>
            <button onClick={toggleChat} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-150">
              Close
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
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
            <div ref={chatEndRef} />
          </div>
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
            <button className="ml-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150" onClick={handleSend}>
              <ArrowUp />
            </button>
          </div>
        </div>
      )}
      
      {isVideoOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-75">
          <div className="relative">
            <video ref={videoRef} autoPlay className="w-full max-w-xl rounded-md" />
            <button onClick={handleStopVideo} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full">
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    // Render chat as a sidebar on larger screens
    <aside className={`border-l transition-all duration-300 ease-in-out ${isOpen ? 'w-[24em]' : 'w-18'}`}>
      <nav className="h-full flex flex-col max-h-[100vh] overflow-y-auto">
        <div className="p-2 my-1.5 flex justify-between items-center">
          <button onClick={toggleChat} className="p-3 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300">
            <MessageSquare />
          </button>
          <h2 className={`text-lg mr-4 font-semibold ${isOpen ? '' : 'hidden'}`}>Chat Support</h2>
        </div>

        {!isOpen && (
          <button 
            onClick={() => window.location.href = '/dashboard'}  
            className="w-[3em] p-3 mx-2 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
          >
            <LayoutDashboard />
          </button>
        )}

        {!isOpen && (
          <button 
            onClick={handleStartVideo}  
            className="w-[3em] p-3 mx-2 my-3 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
          >
            <Camera />
          </button>
        )}

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
            <div ref={chatEndRef} />
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
            <button className="ml-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150" onClick={handleSend}>
              <ArrowUp />
            </button>
          </div>
        )}
      </nav>
      
      {isVideoOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-75">
          <div className="relative">
            {/* Ensure video element is set up properly */}
            <video ref={videoRef} autoPlay className="w-full max-w-xl rounded-md" style={{ display: 'block' }} />
            <button onClick={handleStopVideo} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full">
              Stop
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatBot;
