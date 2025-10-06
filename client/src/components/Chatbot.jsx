import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import aiService from '../services/aiService.js';
import speechService from '../services/speechService.js';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🌤️ සුභ දවසක්! Hello! I'm Lanka Alert Assistant.\n\nI can help with:\n🌦️ Weather updates\n🚨 Disaster alerts\n🛡️ Safe zones\n📦 Inventory status\n📞 Emergency help\n\nAsk me about weather, alerts, or safety in your area!",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText = inputText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get AI response
      const botResponse = await aiService.generateResponse(messageText);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);

      // Speak the response if voice is enabled
      if (voiceEnabled && !isSpeaking) {
        speakText(botResponse);
      }
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: currentLanguage === 'si' ? 
          "සමාවන්න, දැන් සම්බන්ධ වීමට අපහසුයි. කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න." :
          "Sorry, I'm having trouble right now. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    const onResult = (transcript) => {
      setIsListening(false);
      setInputText(transcript);
      // Auto-send voice messages after a short delay
      setTimeout(() => handleSendMessage(transcript), 500);
    };

    const onError = (error) => {
      setIsListening(false);
      console.error('Speech recognition error:', error);
      
      // Don't add error messages to chat, just log them
      console.log('Voice recognition failed:', error);
    };

    const onEnd = () => {
      setIsListening(false);
    };

    // Use current language for recognition
    const recognitionLang = currentLanguage === 'si' ? 'si-LK' : 'en-US';
    const success = speechService.startListening(onResult, onError, onEnd, recognitionLang);
    if (success) {
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const onStart = () => setIsSpeaking(true);
    const onEnd = () => setIsSpeaking(false);
    const onError = (error) => {
      setIsSpeaking(false);
      console.error('Text-to-speech error:', error);
    };

    speechService.speak(text, onStart, onEnd, onError);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'en' ? 'si' : 'en');
  };

  const getQuickActions = () => {
    if (currentLanguage === 'si') {
      return [
        { text: "කොළඹ කාලගුණය", icon: "🌤️" },
        { text: "අලුත්ම අනතුරු ඇඟවීම්", icon: "🚨" },
        { text: "ආරක්ෂිත කලාප", icon: "🛡️" },
        { text: "ගංවතුර අනතුරු ඇඟවීම්", icon: "🌊" },
        { text: "තොග තත්ත්වය", icon: "📋" },
        { text: "අවදානම් කලාප", icon: "⚠️" },
      ];
    } else {
      return [
        { text: "Colombo weather", icon: "🌤️" },
        { text: "Recent alerts", icon: "🚨" },
        { text: "Safe zones", icon: "🛡️" },
        { text: "Current flood alerts", icon: "🌊" },
        { text: "Stock levels", icon: "📋" },
        { text: "Danger zones", icon: "⚠️" },
      ];
    }
  };

  const speechSupport = speechService.isSupported();

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 transform hover:scale-110 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open Lanka Alert Assistant"
      >
        <MessageCircle className="h-6 w-6" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[600px] bg-white rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-7 w-7" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="font-semibold text-lg">Lanka Alert</span>
                <div className="text-xs opacity-90">AI Weather Assistant</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-semibold"
                title={`Switch to ${currentLanguage === 'en' ? 'Sinhala' : 'English'}`}
              >
                {currentLanguage === 'en' ? 'සිං' : 'EN'}
              </button>
              {speechSupport.synthesis && (
                <button
                  onClick={toggleVoice}
                  className={`p-2 rounded-full transition-colors ${
                    voiceEnabled ? 'bg-white/20' : 'bg-white/10'
                  } hover:bg-white/30`}
                  title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                >
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                    message.isBot
                      ? 'bg-white text-gray-800 rounded-bl-md'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message.isBot ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {message.isBot && speechSupport.synthesis && (
                      <button
                        onClick={() => speakText(message.text)}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                        title="Read aloud"
                      >
                        {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-600 mb-3">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {getQuickActions().slice(0, 6).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(action.text)}
                    className="text-xs p-2 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left border"
                    disabled={isLoading}
                  >
                    <span className="mr-1">{action.icon}</span>
                    {action.text}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {getQuickActions().slice(6).map((action, index) => (
                  <button
                    key={index + 6}
                    onClick={() => handleSendMessage(action.text)}
                    className="text-xs p-2 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left border"
                    disabled={isLoading}
                  >
                    <span className="mr-1">{action.icon}</span>
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? 
                  (currentLanguage === 'si' ? "අසමින්..." : "Listening...") : 
                  (currentLanguage === 'si' ? 
                    "කාලගුණය, අනතුරු ඇඟවීම්, ආරක්ෂිත කලාප ගැන අසන්න..." : 
                    "Ask about weather, alerts, safe zones...")
                }
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                disabled={isLoading || isListening}
              />
              
              {speechSupport.recognition && (
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-xl transition-colors ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  disabled={isLoading}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            {/* Voice feedback */}
            {isListening && (
              <div className="text-xs text-red-600 mt-2 text-center animate-pulse">
                🎤 {currentLanguage === 'si' ? 'අසමින්...' : 'Listening...'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;