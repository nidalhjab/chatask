from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import uuid
from datetime import datetime
import asyncio
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import OpenAI and Firebase dependencies
import openai
from firebase_admin import credentials, firestore, initialize_app, auth
import firebase_admin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ChatGPT-Style API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Message(BaseModel):
    id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    isStreaming: Optional[bool] = False

class Conversation(BaseModel):
    id: str
    title: str
    messages: List[Message] = []
    createdAt: str
    updatedAt: str
    userId: str

class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None

class StreamChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None

class ConversationCreateRequest(BaseModel):
    title: Optional[str] = "New Chat"

class ConversationUpdateRequest(BaseModel):
    title: str

# Authentication models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class TokenVerificationRequest(BaseModel):
    token: str

class AuthResponse(BaseModel):
    message: str
    user_id: Optional[str] = None
    email: Optional[str] = None

# Global variables
db = None
openai_client = None

@app.on_event("startup")
async def startup_event():
    """Initialize Firebase and OpenAI on startup"""
    global db, openai_client
    
    try:
        # Initialize Firebase
        if not firebase_admin._apps:
            # Check if we're using a service account file or environment variables
            if os.path.exists("firebase-service-account.json"):
                cred = credentials.Certificate("firebase-service-account.json")
                initialize_app(cred)
            else:
                # Use default credentials (for production)
                initialize_app()
        
        db = firestore.client()
        logger.info("Firebase initialized successfully")
        
        # Initialize OpenAI
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        openai_client = openai.AsyncOpenAI(
            api_key=openai_api_key
        )
        logger.info("OpenAI client initialized successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

# Helper function to verify Firebase token and get user
async def get_current_user(authorization: str = Header(None)):
    """Get current user from Firebase token"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="No valid authorization header")
    
    token = authorization.split(' ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "ChatGPT-Style API is running"}

# Chat endpoints
@app.get("/api/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for the current user"""
    try:
        user_id = current_user['uid']
        conversations_ref = db.collection('conversations')
        query = conversations_ref.where('userId', '==', user_id).order_by('updatedAt', direction=firestore.Query.DESCENDING)
        
        conversations = []
        for doc in query.stream():
            data = doc.to_dict()
            conversations.append(Conversation(
                id=doc.id,
                title=data.get('title', 'New Chat'),
                messages=[],  # Messages loaded separately
                createdAt=data.get('createdAt', ''),
                updatedAt=data.get('updatedAt', ''),
                userId=data.get('userId', '')
            ))
        
        return conversations
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Get messages for a specific conversation"""
    try:
        # Verify user owns this conversation
        conv_ref = db.collection('conversations').document(conversation_id)
        conv_doc = conv_ref.get()
        
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv_data = conv_doc.to_dict()
        if conv_data.get('userId') != current_user['uid']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get messages
        messages_ref = db.collection('conversations').document(conversation_id).collection('messages')
        messages_query = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING)
        
        messages = []
        for doc in messages_query.stream():
            data = doc.to_dict()
            messages.append(Message(
                id=doc.id,
                role=data.get('role'),
                content=data.get('content'),
                timestamp=data.get('timestamp', ''),
                isStreaming=False
            ))
        
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/conversations")
async def create_conversation(request: ConversationCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new conversation"""
    try:
        user_id = current_user['uid']
        timestamp = datetime.now().isoformat()
        
        conv_ref = db.collection('conversations').document()
        conversation_data = {
            'title': request.title,
            'userId': user_id,
            'createdAt': timestamp,
            'updatedAt': timestamp
        }
        
        conv_ref.set(conversation_data)
        
        return Conversation(
            id=conv_ref.id,
            title=request.title,
            messages=[],
            createdAt=timestamp,
            updatedAt=timestamp,
            userId=user_id
        )
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Send a message to a conversation (non-streaming)"""
    try:
        user_id = current_user['uid']
        
        # Verify conversation exists and user owns it
        conv_ref = db.collection('conversations').document(conversation_id)
        conv_doc = conv_ref.get()
        
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv_data = conv_doc.to_dict()
        if conv_data.get('userId') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get conversation history
        messages_ref = conv_ref.collection('messages')
        messages_query = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING)
        
        conversation_history = []
        for doc in messages_query.stream():
            data = doc.to_dict()
            conversation_history.append({
                'role': data.get('role'),
                'content': data.get('content')
            })
        
        # Add user message
        user_message_ref = messages_ref.document()
        user_message_data = {
            'role': 'user',
            'content': request.message,
            'timestamp': datetime.now().isoformat()
        }
        user_message_ref.set(user_message_data)
        
        # Prepare messages for OpenAI
        openai_messages = conversation_history + [{'role': 'user', 'content': request.message}]
        
        # Get response from OpenAI
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=openai_messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        assistant_content = response.choices[0].message.content
        
        # Save assistant message
        assistant_message_ref = messages_ref.document()
        assistant_message_data = {
            'role': 'assistant',
            'content': assistant_content,
            'timestamp': datetime.now().isoformat()
        }
        assistant_message_ref.set(assistant_message_data)
        
        # Update conversation timestamp and title if needed
        update_data = {'updatedAt': datetime.now().isoformat()}
        if conv_data.get('title') == 'New Chat' and len(conversation_history) == 0:
            title = request.message[:50] + '...' if len(request.message) > 50 else request.message
            update_data['title'] = title
        
        conv_ref.update(update_data)
        
        return {
            'userMessage': Message(
                id=user_message_ref.id,
                role='user',
                content=request.message,
                timestamp=user_message_data['timestamp']
            ),
            'assistantMessage': Message(
                id=assistant_message_ref.id,
                role='assistant',
                content=assistant_content,
                timestamp=assistant_message_data['timestamp']
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/conversations/{conversation_id}/messages/stream")
async def send_message_stream(conversation_id: str, request: StreamChatRequest, current_user: dict = Depends(get_current_user)):
    """Send a message with streaming response"""
    async def generate_response():
        try:
            user_id = current_user['uid']
            
            # Verify conversation exists and user owns it
            conv_ref = db.collection('conversations').document(conversation_id)
            conv_doc = conv_ref.get()
            
            if not conv_doc.exists:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Conversation not found'})}\n\n"
                return
            
            conv_data = conv_doc.to_dict()
            if conv_data.get('userId') != user_id:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Access denied'})}\n\n"
                return
            
            # Get conversation history
            messages_ref = conv_ref.collection('messages')
            messages_query = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING)
            
            conversation_history = []
            for doc in messages_query.stream():
                data = doc.to_dict()
                conversation_history.append({
                    'role': data.get('role'),
                    'content': data.get('content')
                })
            
            # Add user message
            user_message_ref = messages_ref.document()
            user_message_data = {
                'role': 'user',
                'content': request.message,
                'timestamp': datetime.now().isoformat()
            }
            user_message_ref.set(user_message_data)
            
            # Send user message confirmation
            yield f"data: {json.dumps({'type': 'user_message', 'message': {'id': user_message_ref.id, 'role': 'user', 'content': request.message, 'timestamp': user_message_data['timestamp']}})}\n\n"
            
            # Create assistant message placeholder
            assistant_message_ref = messages_ref.document()
            assistant_message_data = {
                'role': 'assistant',
                'content': '',
                'timestamp': datetime.now().isoformat()
            }
            
            # Send assistant message placeholder
            yield f"data: {json.dumps({'type': 'assistant_message_start', 'messageId': assistant_message_ref.id, 'timestamp': assistant_message_data['timestamp']})}\n\n"
            
            # Prepare messages for OpenAI
            openai_messages = conversation_history + [{'role': 'user', 'content': request.message}]
            
            # Stream response from OpenAI
            response = await openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=openai_messages,
                max_tokens=1000,
                temperature=0.7,
                stream=True
            )
            
            full_content = ""
            
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    yield f"data: {json.dumps({'type': 'content', 'content': content, 'messageId': assistant_message_ref.id})}\n\n"
            
            # Save complete assistant message
            assistant_message_data['content'] = full_content
            assistant_message_ref.set(assistant_message_data)
            
            # Update conversation timestamp and title if needed
            update_data = {'updatedAt': datetime.now().isoformat()}
            if conv_data.get('title') == 'New Chat' and len(conversation_history) == 0:
                title = request.message[:50] + '...' if len(request.message) > 50 else request.message
                update_data['title'] = title
            
            conv_ref.update(update_data)
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'end', 'messageId': assistant_message_ref.id})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming endpoint: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a conversation and all its messages"""
    try:
        user_id = current_user['uid']
        
        # Verify conversation exists and user owns it
        conv_ref = db.collection('conversations').document(conversation_id)
        conv_doc = conv_ref.get()
        
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv_data = conv_doc.to_dict()
        if conv_data.get('userId') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete all messages in subcollection
        messages_ref = conv_ref.collection('messages')
        batch = db.batch()
        
        for doc in messages_ref.stream():
            batch.delete(doc.reference)
        
        # Delete the conversation document
        batch.delete(conv_ref)
        batch.commit()
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/conversations/{conversation_id}/clear")
async def clear_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Clear all messages from a conversation"""
    try:
        user_id = current_user['uid']
        
        # Verify conversation exists and user owns it
        conv_ref = db.collection('conversations').document(conversation_id)
        conv_doc = conv_ref.get()
        
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv_data = conv_doc.to_dict()
        if conv_data.get('userId') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete all messages in subcollection
        messages_ref = conv_ref.collection('messages')
        batch = db.batch()
        
        for doc in messages_ref.stream():
            batch.delete(doc.reference)
        
        # Update conversation title and timestamp
        batch.update(conv_ref, {
            'title': 'New Chat',
            'updatedAt': datetime.now().isoformat()
        })
        
        batch.commit()
        
        return {"message": "Conversation cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Authentication endpoints
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login endpoint - Note: This endpoint is for reference, actual authentication is handled by Firebase client-side"""
    try:
        # In a real implementation, you might want to create custom tokens here
        # For now, we'll just validate that the user exists
        user = auth.get_user_by_email(request.email)
        return AuthResponse(
            message="Login successful",
            user_id=user.uid,
            email=user.email
        )
    except auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error in login endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register endpoint - Note: This endpoint is for reference, actual registration is handled by Firebase client-side"""
    try:
        # Create user in Firebase
        user = auth.create_user(
            email=request.email,
            password=request.password
        )
        return AuthResponse(
            message="Registration successful",
            user_id=user.uid,
            email=user.email
        )
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        logger.error(f"Error in register endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/verify-token")
async def verify_token(request: TokenVerificationRequest):
    """Verify Firebase ID token"""
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(request.token)
        user_id = decoded_token['uid']
        email = decoded_token.get('email')
        
        return AuthResponse(
            message="Token is valid",
            user_id=user_id,
            email=email
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 