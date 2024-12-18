"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Menu, Home, Users, Calendar, Zap, Bell, Box, Settings, Upload, ArrowLeft, ArrowRight, Square, ThumbsDown, Share2, Paperclip, X, Image as ImageIcon, FileText, File, Download, Eye } from 'lucide-react';
import FloorPlanButton from './FloorPlanButton';

const BuildBotInterface = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('BuildBot');
  const [activeTask, setActiveTask] = useState('Convert garage into a studio apartment');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentChat, setCurrentChat] = useState([
    { 
      sender: 'BuildBot', 
      content: { type: 'text', text: 'How can I help you?' },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
    },
    { 
      sender: 'You', 
      content: { type: 'text', text: 'Convert garage into a studio apartment' },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
    },
    { 
      sender: 'BuildBot', 
      content: { type: 'text', text: 'Upload existing floor plan, zoom to design area' },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
    }
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat]);

  const sidebarItems = [
    { icon: <Home className="w-4 h-4" />, text: 'BuildBot', id: 'BuildBot' },
    { icon: <Users className="w-4 h-4" />, text: 'Connect With A Professional', id: 'Connect' },
    { icon: <Box className="w-4 h-4" />, text: 'Custom Instructions', id: 'Instructions' }
  ];

  const taskList = [
    'Convert garage into a studio apartment',
    'Plan my new apartment layout',
    'New kitchen cabinet design',
    'What wall paper can match my furniture',
    'Garden design for home in dessert area'
  ];

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toUpperCase();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Remove the generateBuildBotResponse function as we'll use Claude instead

  // Update the handleSendMessage function in BuildBotInterface.jsx

  // In BuildBotInterface.jsx, update the handleSendMessage function:

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedFile) return;

    const time = getCurrentTime();
    let userMessage = {
      sender: 'You',
      time: time,
    };

    // Handle file content
    if (selectedFile) {
      userMessage.content = {
        type: 'file',
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
        text: inputMessage.trim() || '',  // Empty string instead of null
        imageUrl: selectedFile.type.startsWith('image/') ? imagePreview : null
      };
    } else {
      userMessage.content = {
        type: 'text',
        text: inputMessage
      };
    }

    // Add user message to chat immediately
    setCurrentChat(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFile(null);
    setImagePreview(null);

    try {
      // Show loading state
      setCurrentChat(prev => [...prev, {
        sender: 'BuildBot',
        content: { type: 'text', text: '...' },
        time: getCurrentTime(),
        isLoading: true
      }]);

      // Make API call to your backend with a default empty string for message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content.text || ' ',  // Send space instead of empty string
          file: selectedFile ? {
            name: selectedFile.name,
            type: selectedFile.type,
            data: imagePreview
          } : null,
          generateFloorPlan: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from BuildBot');
      }

      const data = await response.json();

      // Remove loading message and add BuildBot's response
      setCurrentChat(prev => {
        const filteredChat = prev.filter(msg => !msg.isLoading);
        return [...filteredChat, {
          sender: 'BuildBot',
          content: { 
            type: 'text', 
            text: data.response,
            executionResults: data.executionResults
          },
          time: getCurrentTime()
        }];
      });
    } catch (error) {
      // Handle error case
      setCurrentChat(prev => {
        const filteredChat = prev.filter(msg => !msg.isLoading);
        return [...filteredChat, {
          sender: 'BuildBot',
          content: { 
            type: 'text', 
            text: `Error: ${error.message}` 
          },
          time: getCurrentTime()
        }];
      });
      console.error('Error getting BuildBot response:', error);
    }
  };
  
  // Add a handler for floor plan messages
  const handleFloorPlanMessage = (message) => {
    setCurrentChat(prev => [...prev, message]);
  };
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const handleTaskClick = (task) => {
    setActiveTask(task);
    setCurrentChat([
      { 
        sender: 'BuildBot', 
        content: { type: 'text', text: 'How can I help you?' },
        time: getCurrentTime()
      },
      { 
        sender: 'You', 
        content: { type: 'text', text: task },
        time: getCurrentTime()
      },
      {
        sender: 'BuildBot',
        content: { type: 'text', text: 'Upload existing floor plan, zoom to design area' },
        time: getCurrentTime()
      }
    ]);
  };

  const MessageContent = ({ content }) => {
    // Only handle DXF file display
    const renderDxfFile = (file) => {
      return (
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-300">
                  Floor Plan Generated
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([atob(file.data)], { type: 'application/dxf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download DXF</span>
            </button>
          </div>
        </div>
      );
    };
    // Debug logging to see what's coming into the component
  console.log('MessageContent received:', {
    type: content.type,
    hasExecutionResults: !!content.executionResults,
    executionResults: content.executionResults
  });

  if (content.type === 'text' && content.executionResults) {
    // Find any DXF files in the execution results
    const dxfFiles = content.executionResults.flatMap(result => {
      console.log('Processing result:', {
        success: result.success,
        hasFiles: !!result.files,
        files: result.files
      });
      return result.files || [];
    }).filter(file => file.name.toLowerCase().endsWith('.dxf'));

    console.log('Found DXF files:', dxfFiles);

    if (dxfFiles.length > 0) {
      return (
        <div className="mt-4">
          {dxfFiles.map((file, index) => (
            <div key={index} className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-blue-700 dark:text-blue-300">
                      Floor Plan Generated
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([atob(file.data)], { type: 'application/dxf' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download DXF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

    // For regular chat messages
    else if (content.type === 'text') {
      return <div>{content.text}</div>;
    } else if (content.type === 'file') {
      const isImage = content.fileType?.startsWith('image/');
    
      return (
        <div className="flex flex-col space-y-2">
          {content.text && <div>{content.text}</div>}
          <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {isImage ? (
              <div className="flex flex-col space-y-2">
                <div className="max-w-sm">
                  <img 
                    src={content.imageUrl} 
                    alt={content.fileName}
                    className="rounded-lg w-full h-auto object-contain" 
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {content.fileName} ({content.fileSize})
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <File className="w-8 h-8 mr-3 text-gray-500" />
                <div className="text-sm">
                  <div>{content.fileName}</div>
                  <div className="text-gray-500">{content.fileSize}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-64 border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        {/* Logo */}
        <div className="p-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
          <span className="font-bold text-xl">BuildBot</span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="px-4 py-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center space-x-3 p-2 rounded-lg mb-1 transition-colors duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.text}</span>
            </button>
          ))}

          {/* Tasks Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Today</h2>
              <span className="text-sm text-gray-500">12</span>
            </div>
            <div className="mt-2">
              {taskList.map((task) => (
                <button
                  key={task}
                  onClick={() => handleTaskClick(task)}
                  className={`w-full text-left p-2 rounded-lg mb-1 transition-colors duration-200 
                    ${activeTask === task 
                      ? 'bg-blue-100 text-blue-600' 
                      : darkMode 
                        ? 'hover:bg-gray-700' 
                        : 'hover:bg-gray-200'
                    }`}
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`h-14 border-b flex items-center justify-between px-4 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            <span className="font-semibold">{activeTab}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentChat.map((message, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold">{message.sender}</span>
                <span className="text-sm text-gray-500">{message.time}</span>
              </div>
              <div className={`p-3 rounded-lg ${
                message.sender === 'You' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : darkMode 
                    ? 'bg-gray-800' 
                    : 'bg-gray-100'
              }`}>
                <MessageContent content={message.content} />
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {/* Floor Plan Button */}
        <div className="border-t p-4">
          <FloorPlanButton 
            chatHistory={currentChat} 
            onMessageGenerated={handleFloorPlanMessage}
          />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          {selectedFile && (
            <div className="mb-2">
              <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="flex items-center space-x-2 w-full">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block">{selectedFile.name}</span>
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="mt-2 rounded-lg max-h-32 object-contain"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message BuildBot..."
              className={`flex-1 p-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200'
              }`}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
              // Update disabled condition to allow either text or file
              disabled={!inputMessage.trim() && !selectedFile}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuildBotInterface;