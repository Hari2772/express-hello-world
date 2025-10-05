const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Root endpoint - serve the web chat interface
app.get("/", (req, res) => res.type('html').send(html));

// Chat POST endpoint with Gemini integration
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message field is required" });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // If Gemini API key is available, call Gemini API
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: message
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Gemini API error response:', errorData);
          throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;
        
        return res.json({ 
          reply,
          source: 'gemini'
        });
      } catch (error) {
        console.error('Gemini API error:', error);
        return res.json({ 
          reply: `Echo (Gemini unavailable): ${message}`,
          source: 'fallback',
          error: error.message
        });
      }
    } else {
      return res.json({ 
        reply: `Echo (No API key configured): ${message}`,
        source: 'static'
      });
    }
  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini Chat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .chat-container {
      width: 100%;
      max-width: 600px;
      height: 90vh;
      max-height: 700px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
    }
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f5f5f5;
    }
    .message {
      margin-bottom: 15px;
      display: flex;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .message.user {
      justify-content: flex-end;
    }
    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
    }
    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message.bot .message-content {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .chat-input-container {
      padding: 20px;
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
    }
    #messageInput {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.3s;
    }
    #messageInput:focus {
      border-color: #667eea;
    }
    #sendButton {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #sendButton:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    #sendButton:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .typing-indicator {
      display: none;
      padding: 12px 16px;
      background: white;
      border-radius: 18px;
      width: fit-content;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .typing-indicator.active {
      display: block;
    }
    .typing-indicator span {
      height: 8px;
      width: 8px;
      background: #667eea;
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }
    @media (max-width: 768px) {
      .chat-container {
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
      }
      .message-content {
        max-width: 85%;
      }
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      💬 Gemini Chat
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="message bot">
        <div class="message-content">
          👋 Hello! I'm powered by Gemini AI. Ask me anything!
        </div>
      </div>
    </div>
    <div class="chat-input-container">
      <input type="text" id="messageInput" placeholder="Type your message..." autocomplete="off">
      <button id="sendButton">Send</button>
    </div>
  </div>

  <script>
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    function addMessage(content, isUser) {
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${isUser ? 'user' : 'bot'}\`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = content;
      
      messageDiv.appendChild(contentDiv);
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot';
      typingDiv.id = 'typingIndicator';
      typingDiv.innerHTML = '<div class="typing-indicator active"><span></span><span></span><span></span></div>';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
      const typingIndicator = document.getElementById('typingIndicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;

      addMessage(message, true);
      messageInput.value = '';
      sendButton.disabled = true;
      messageInput.disabled = true;
      
      showTypingIndicator();

      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });

        const data = await response.json();
        hideTypingIndicator();
        
        if (data.reply) {
          addMessage(data.reply, false);
        } else if (data.error) {
          addMessage('Sorry, something went wrong: ' + data.error, false);
        }
      } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I couldn\'t connect to the server.', false);
        console.error('Error:', error);
      } finally {
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
      }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    messageInput.focus();
  </script>
</body>
</html>
`;
