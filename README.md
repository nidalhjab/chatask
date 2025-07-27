# ChatGPT-Style Web Application

A modern, full-stack ChatGPT-style web application built with React, FastAPI, Firebase Firestore, and OpenAI's API. Features real-time streaming responses, conversation management, and a sleek user interface.

## 🚀 Features

- **Modern Chat Interface**: Clean, responsive UI similar to ChatGPT
- **Real-time Streaming**: AI responses appear word-by-word as they're generated
- **Conversation Management**: Create, save, and manage multiple conversations
- **Firebase Integration**: Persistent conversation history with Firestore
- **OpenAI Integration**: Powered by GPT-3.5-turbo for intelligent responses
- **Anonymous Authentication**: Quick guest access without registration
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Context Awareness**: Maintains conversation context for coherent multi-turn dialogue
- **Error Handling**: Graceful error handling with user-friendly messages

## 🏗️ Architecture

```
├── Frontend (React + TypeScript)
│   ├── Chat Interface
│   ├── Conversation Management
│   ├── Firebase Auth
│   └── Real-time Streaming
├── Backend (FastAPI + Python)
│   ├── OpenAI Integration
│   ├── Streaming Endpoints
│   ├── Firebase Admin
│   └── Conversation API
└── Database (Firebase Firestore)
    └── Conversation Storage
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## 🔑 API Keys Required

You'll need the following API keys and services:

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Firebase Project**: Create at [Firebase Console](https://console.firebase.google.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd chatask
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your Firebase configuration
# REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# REACT_APP_FIREBASE_APP_ID=your_app_id
# REACT_APP_API_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Edit .env file with your API keys
# OPENAI_API_KEY=your_openai_api_key_here
# FIREBASE_PROJECT_ID=your_firebase_project_id
# ... (other Firebase configs if needed)
```

### 4. Firebase Setup

#### Option A: Using Service Account (Recommended for Production)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings → Service Accounts
4. Generate new private key and download JSON file
5. Rename the file to `firebase-service-account.json`
6. Place it in the `backend/` directory

#### Option B: Using Environment Variables

Add Firebase credentials to your `backend/.env` file:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

### 5. Firestore Database Setup

1. In Firebase Console, go to Firestore Database
2. Create database in production mode
3. Set up security rules (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🏃‍♂️ Running the Application

### Development Mode

You need to run both frontend and backend simultaneously:

#### Terminal 1 - Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

The backend will start on `http://localhost:8000`

#### Terminal 2 - Frontend Server

```bash
# In the project root directory
npm start
```

The frontend will start on `http://localhost:3000`

### Production Deployment

#### Backend Deployment

```bash
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Deployment

```bash
npm run build
# Deploy the 'build' folder to your hosting service
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
- `REACT_APP_FIREBASE_API_KEY`: Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID`: Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID`: Firebase app ID
- `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key for direct frontend integration

#### Backend (backend/.env)
- `OPENAI_API_KEY`: Your OpenAI API key
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `API_PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins
- `ENVIRONMENT`: development or production

## 📡 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send a message (synchronous)
- `POST /api/chat/stream` - Send a message (streaming response)

### Conversation Management
- `GET /api/conversations` - List user conversations
- `GET /api/conversations/{id}` - Get specific conversation
- `POST /api/conversations/new` - Create new conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### Health Check
- `GET /` - Health check endpoint

## 🏗️ Project Structure

```
chatask/
├── public/                     # Static files
├── src/
│   ├── components/            # React components
│   │   ├── AuthProvider.tsx   # Authentication wrapper
│   │   ├── ChatInterface.tsx  # Main chat interface
│   │   ├── ChatInput.tsx      # Message input component
│   │   ├── MessageBubble.tsx  # Message display component
│   │   ├── Sidebar.tsx        # Conversation sidebar
│   │   └── LoadingSpinner.tsx # Loading indicator
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ChatContext.tsx    # Chat state management
│   ├── config/
│   │   └── firebase.ts        # Firebase configuration
│   ├── App.tsx               # Main application component
│   ├── App.css              # Application styles
│   └── index.tsx            # Application entry point
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── env.example         # Environment template
├── package.json             # Frontend dependencies
├── README.md               # This file
└── .gitignore             # Git ignore rules
```

## 🧪 Testing

### Frontend Testing
```bash
npm test
```

### Backend Testing
```bash
cd backend
python -m pytest
```

## 🚀 Features in Detail

### Real-time Streaming
The application implements Server-Sent Events (SSE) for real-time streaming of AI responses. Messages appear word-by-word as they're generated by the OpenAI API.

### Conversation Context
Each conversation maintains its full message history, allowing for coherent multi-turn dialogue. The system sends the entire conversation context to OpenAI for each request.

### Error Handling
- Network errors are handled gracefully with retry mechanisms
- API rate limits are respected with appropriate user feedback
- Firebase connection issues fall back to local storage

### Responsive Design
The application works seamlessly across devices:
- Desktop: Full sidebar with conversation list
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation for conversations

## 🔒 Security Considerations

- API keys are stored in environment variables
- Firebase security rules restrict data access
- CORS is configured to allow only specific origins
- Input sanitization prevents XSS attacks

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if port 8000 is available
   - Verify environment variables are set
   - Ensure Python virtual environment is activated

2. **Firebase connection errors**
   - Verify Firebase configuration
   - Check internet connectivity
   - Ensure Firestore is enabled in Firebase Console

3. **OpenAI API errors**
   - Verify API key is valid and has credits
   - Check API rate limits
   - Ensure model availability

4. **Frontend build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Debug Mode

Enable debug logging:

```bash
# Backend
export LOG_LEVEL=DEBUG
python main.py

# Frontend
REACT_APP_DEBUG=true npm start
```

## 📈 Performance Optimization

- Conversation list is virtualized for large numbers of conversations
- Messages are lazy-loaded as needed
- Streaming responses reduce perceived latency
- Local caching minimizes Firebase reads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT API
- Firebase for backend infrastructure
- React team for the excellent framework
- FastAPI for the high-performance backend framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed description
4. Include relevant logs and error messages

---

Built with ❤️ using React, FastAPI, Firebase, and OpenAI
