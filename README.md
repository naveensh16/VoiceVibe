# 🎙️ VoiceVibe

**Your intelligent voice assistant powered by AI**

VoiceVibe is a modern, full-stack web application that combines AI-powered chat capabilities with voice transcription features. Built with Flask and featuring a sleek DeFi-inspired dark theme, it offers a seamless conversational AI experience.

---

## ✨ Features

### 🤖 AI Chat Assistant
- **Real-time Conversations**: Powered by Groq's LLaMA 3.3 70B model
- **Persistent Chat History**: All conversations saved with localStorage
- **Message Export**: Download chat transcripts as text files
- **Typing Indicators**: Visual feedback during AI responses

### 🎵 Audio Transcription
- **Multi-Format Support**: MP3, WAV, M4A audio files
- **Drag & Drop Upload**: Intuitive file management
- **Auto-Processing**: Automatic transcription on upload
- **File Preview**: See uploaded files with status tracking

### 📄 Document Support
- **Text & PDF**: Support for TXT and PDF document uploads
- **File Size Limit**: Up to 25MB per file
- **Status Tracking**: Visual indicators for processing status

### 🎨 Modern UI/UX
- **Dark/Light Themes**: Toggle between elegant themes
- **Animated Gradients**: DeFi-inspired floating orb backgrounds
- **Glass Morphism**: Modern frosted glass design elements
- **Responsive Layout**: Works seamlessly on all screen sizes
- **Smooth Animations**: Polished transitions and hover effects

### 🔐 Authentication & Security
- **User Registration**: Secure account creation
- **Session Management**: Token-based authentication
- **Password Hashing**: Werkzeug secure password storage
- **Protected Routes**: Middleware-based route protection

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voicevibe.git
   cd voicevibe
   ```

2. **Create virtual environment** (recommended)
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key-here
   GROQ_API_KEY=your-groq-api-key
   DATABASE_URL=sqlite:///voicevibe.db
   TOKEN_EXPIRE_SECONDS=86400
   ```

   **Get your Groq API Key:**
   - Visit [console.groq.com](https://console.groq.com)
   - Sign up for a free account
   - Generate an API key from the dashboard

5. **Run the application**
   ```bash
   python run.py
   ```

6. **Open in browser**
   ```
   http://localhost:8000
   ```

### 🚀 Deploy to Vercel

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `SECRET_KEY`: Your secret key
     - `GROQ_API_KEY`: Your Groq API key
     - `DATABASE_URL`: Use Vercel Postgres or external DB
   - Click "Deploy"

3. **Configure Database** (Important)
   - SQLite doesn't work on Vercel (serverless)
   - Use Vercel Postgres, PostgreSQL, or MongoDB
   - Update `DATABASE_URL` in environment variables

**Note**: File uploads and persistent storage require external storage solutions (AWS S3, Cloudinary, etc.) as Vercel's filesystem is read-only.

---

## 📁 Project Structure & File Details

```
VoiceVibe/
├── voicevibe/                 # Main application package
│   ├── __init__.py           # App factory & configuration
│   ├── config.py             # Environment & app settings
│   ├── models.py             # SQLAlchemy database models
│   ├── auth.py               # Authentication routes & middleware
│   ├── llm.py                # Groq LLM integration
│   ├── chat.py               # Chat & file upload API endpoints
│   └── routes.py             # UI template routes
│
├── static/                    # Static assets
│   ├── css/
│   │   ├── base.css          # Global styles & CSS variables
│   │   ├── home.css          # Landing page styles
│   │   └── chat.css          # Chat interface styles
│   ├── js/
│   │   ├── chat.js           # Chat functionality & file uploads
│   │   └── theme.js          # Theme switching logic
│   └── img/                  # Images and icons
│
├── templates/                 # Jinja2 HTML templates
│   ├── layout.html           # Base template with common structure
│   ├── index.html            # Landing page
│   ├── login.html            # Login page
│   ├── register.html         # Registration page
│   └── chat.html             # Chat interface
│
├── uploads/                   # User uploaded files (audio, docs)
├── logs/                      # Application logs
├── instance/                  # Instance-specific data
├── requirements.txt           # Python dependencies
├── run.py                     # Application entry point
└── README.md                  # This file
```

### 🔍 Detailed File Descriptions

#### Backend (`voicevibe/`)

**`__init__.py`** - Flask Application Factory
- Creates and configures the Flask app instance
- Registers blueprints (ui_bp, auth_bp, chat_bp)
- Sets up session configuration with secure defaults
- Initializes database tables on startup
- Configures secret key and session persistence
- ~50 lines | Core: App initialization, blueprint registration

**`config.py`** - Application Configuration
- Loads environment variables from `.env` file
- Defines Config class with all app settings
- Database URL configuration (SQLite default)
- API keys (Groq, Whisper) management
- Session security settings (cookie flags, lifetime)
- ~30 lines | Core: Environment-based configuration

**`models.py`** - Database Models
- SQLAlchemy ORM models and database setup
- **User**: Authentication (username, password_hash, is_admin)
- **Conversation**: Chat sessions (user_id, title, timestamps)
- **Message**: Individual messages (role, content, conversation_id)
- Relationships: User → Conversations → Messages
- Database engine and session factory creation
- ~55 lines | Core: Data persistence layer

**`auth.py`** - Authentication System
- **Blueprint**: `/register`, `/login`, `/logout` routes
- **`require_auth`** decorator: Protects routes requiring login
- Password hashing with Werkzeug's `generate_password_hash`
- Session-based authentication (no JWT tokens)
- User registration with validation (3+ char username/password)
- Login with credentials verification
- Session persistence across requests
- ~160 lines | Core: User authentication & authorization

**`llm.py`** - LLM Integration
- Groq API client for LLaMA 3.3 70B model
- **`run_llm(prompt)`**: Main function to get AI responses
- Fallback to dummy response if no API key
- Error handling for API failures
- Configurable temperature, max_tokens, top_p
- Logging for debugging API calls
- ~47 lines | Core: AI conversation generation

**`chat.py`** - Chat & File Upload API
- **`/chat`** (POST): Text message endpoint
- **`/voice`** (POST): Audio file upload & transcription
- **`/history`** (GET): List user's conversations
- **`/conversation/<id>`** (GET): Retrieve specific conversation
- **`/chat-ui`** (GET): Serve chat interface template
- File handling: Save uploads, process audio
- Database operations: Save messages, create conversations
- Protected routes with `@require_auth` decorator
- ~126 lines | Core: Chat logic & file processing

**`routes.py`** - UI Template Routes
- **`/`** (GET): Landing page (index.html)
- Simple UI blueprint for serving HTML templates
- Logging for route access tracking
- ~13 lines | Core: Template rendering

#### Frontend (`static/`)

**`static/css/base.css`** - Global Styles
- CSS custom properties (CSS variables) for theming
- `:root` with dark theme colors (primary, accent, text)
- `[data-theme="light"]` overrides for light mode
- Typography, spacing, and radius tokens
- Universal reset and box-sizing
- ~100 lines | Core: Design system foundation

**`static/css/home.css`** - Landing Page Styles
- Animated gradient background with 3 floating orbs
- `@keyframes float` for orb animations
- Navigation bar with glassmorphism effects
- Hero section with gradient text
- Button styles (primary, secondary)
- Responsive design for mobile/tablet
- DeFi-inspired dark aesthetic
- ~556 lines | Core: Homepage visual design

**`static/css/chat.css`** - Chat Interface Styles
- 3-column grid layout (sidebar, main, upload panel)
- Message bubbles (user vs bot styling)
- Input wrapper with file/mic buttons
- Upload drop zone with drag & drop states
- Navigation sidebar items
- Typing indicator animation
- Theme-specific overrides for light mode
- Animated gradient background matching home
- ~1491 lines | Core: Chat UI & interactions

**`static/js/chat.js`** - Chat Application Logic
- **Message Handling**: Send text, receive responses
- **localStorage**: Persistent chat history
- **File Upload**: Drag & drop, click to upload
- **File Processing**: Audio transcription via `/voice` endpoint
- **Export**: Download chat as text file
- **Clear**: Remove all history
- **Navigation**: Switch between Chat/History/Settings
- Event listeners for user interactions
- ~435 lines | Core: Chat functionality & state

**`static/js/theme.js`** - Theme Toggle
- Dark/Light mode switcher
- localStorage persistence for theme preference
- Updates `data-theme` attribute on `<html>`
- Toggle button emoji update (🌙/☀️)
- Auto-load saved theme on page load
- ~30 lines | Core: Theme management

#### Templates (`templates/`)

**`layout.html`** - Base Template
- Common HTML structure for all pages
- `<head>` with meta tags, favicon, CSS includes
- Navigation bar placeholder
- Jinja2 blocks: `title`, `description`, `extra_css`, `content`, `extra_js`
- Script includes (theme.js)
- ~80 lines | Core: Template inheritance base

**`index.html`** - Landing Page
- Extends `layout.html`
- Hero section with animated gradient orbs
- Navigation with Sign In / Create Account buttons
- Main title with gradient text effect
- CTA buttons linking to /login and /register
- ~70 lines | Core: Homepage content

**`login.html`** - Login Page
- Login form (username, password)
- JavaScript for form submission via fetch API
- Error handling and display
- Redirect to `/chat-ui` on success
- ~100 lines | Core: User authentication UI

**`register.html`** - Registration Page
- Registration form (username, password, confirm password)
- Client-side validation
- JavaScript for account creation
- Redirect to `/chat-ui` on success
- ~120 lines | Core: User registration UI

**`chat.html`** - Chat Interface
- 3-panel layout: Sidebar, Main chat, Upload panel
- Sidebar: Navigation (Chat, History, Settings)
- Main: Message area, input wrapper with file/mic buttons
- Upload panel: Drag & drop zone, file list, clear button
- Theme toggle button in topbar
- Logout button
- ~155 lines | Core: Main application UI

#### Other Files

**`run.py`** - Application Entry Point
- Imports `create_app` from voicevibe package
- Configures logging (INFO level)
- Runs Flask development server on port 8000
- Binds to all interfaces (0.0.0.0)
- ~16 lines | Core: Server startup

**`requirements.txt`** - Python Dependencies
- Flask>=2.1 - Web framework
- SQLAlchemy>=2.0 - ORM for database
- Werkzeug>=2.0 - Password hashing & utilities
- PyJWT>=2.6 - JSON Web Tokens (unused currently)
- python-dotenv>=0.21 - Environment variable loading
- gunicorn - Production WSGI server
- groq - Groq API client for LLM
- ~8 dependencies | Core: Package management

**`.env`** - Environment Variables (not in repo)
```env
SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key
DATABASE_URL=sqlite:///voicevibe.db
TOKEN_EXPIRE_SECONDS=86400
```

---

## 🛠️ Technology Stack

### Backend
- **Flask 3.x** - Web framework
- **SQLAlchemy 2.x** - ORM for database management
- **SQLite** - Default database (configurable)
- **Werkzeug** - Password hashing and security
- **PyJWT** - JSON Web Token authentication
- **Groq API** - LLaMA 3.3 70B language model

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with animations
- **HTML5** - Semantic markup
- **localStorage** - Client-side data persistence

### Features
- Session-based authentication
- File upload handling
- Real-time chat interface
- Theme persistence
- Responsive design

---

## 🎯 Usage

### 1. Create an Account
- Navigate to the homepage
- Click "Create Account"
- Fill in your details and register

### 2. Start Chatting
- Log in with your credentials
- Type your message in the input box
- Press Enter or click the send button (➤)
- View AI responses in real-time

### 3. Upload Audio Files
- Click the 📎 attachment button
- Select or drag & drop audio files (MP3, WAV, M4A)
- Files are automatically transcribed
- AI responds to the transcribed text

### 4. Manage Chat History
- Click "History" in the sidebar
- View past conversations
- Export chats as text files
- Clear history when needed

### 5. Switch Themes
- Click the theme toggle button (🌙/☀️) in the top bar
- Choose between Dark and Light modes
- Theme preference is saved automatically

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key for sessions | `dev-secret` |
| `GROQ_API_KEY` | Groq API key for LLM | `""` |
| `DATABASE_URL` | Database connection string | `sqlite:///voicevibe.db` |
| `TOKEN_EXPIRE_SECONDS` | Auth token expiration | `86400` (24 hours) |
| `WHISPER_API_URL` | Whisper ASR endpoint (optional) | `""` |

### Database Configuration

The app uses SQLite by default. To use PostgreSQL or MySQL:

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/voicevibe

# MySQL
DATABASE_URL=mysql://user:password@localhost/voicevibe
```

---

## 🎨 Customization

### Themes

Edit CSS variables in `static/css/base.css`:

```css
:root {
  --primary: #007AFF;
  --accent: #5E5CE6;
  --bg: #000000;
  --text: #ffffff;
  /* ... more variables */
}
```

### LLM Model

Change the model in `voicevibe/llm.py`:

```python
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",  # Change this
    messages=[{"role": "user", "content": prompt}],
    temperature=0.7,
    max_tokens=1024
)
```

---

## 📝 API Endpoints

### Authentication
- `POST /register` - Create new account
- `POST /login` - User login
- `GET /logout` - User logout

### Chat
- `GET /chat-ui` - Load chat interface
- `POST /chat` - Send text message
- `POST /voice` - Upload audio for transcription
- `GET /history` - Get conversation list
- `GET /conversation/<id>` - Get specific conversation

### UI
- `GET /` - Landing page
- `GET /login` - Login page
- `GET /register` - Registration page

---

## 🐛 Troubleshooting

### Common Issues

**1. Import errors**
```bash
pip install -r requirements.txt --upgrade
```

**2. Database locked**
```bash
# Delete the database file and restart
rm voicevibe.db
python run.py
```

**3. Groq API errors**
- Check your API key in `.env`
- Verify rate limits at console.groq.com
- Ensure you have credits available

**4. File upload issues**
- Check `uploads/` directory permissions
- Verify file size < 25MB
- Ensure correct file format (MP3, WAV, M4A, PDF, TXT)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** - For providing the LLaMA 3.3 API
- **Flask** - Excellent web framework
- **Design Inspiration** - DeFi and modern web3 interfaces

---

## 📧 Contact

**Naveen** - [@yourusername](https://github.com/naveensh16)

Project Link: [https://github.com/yourusername/voicevibe](https://github.com/naveensh16/voicevibe)

---

## 🚧 Roadmap

- [ ] Real-time voice recording
- [ ] Multi-language support
- [ ] Voice synthesis (TTS)
- [ ] Advanced document parsing
- [ ] User profile management
- [ ] Conversation sharing
- [ ] Mobile app version
- [ ] Docker deployment
- [ ] Cloud storage integration

---

<div align="center">
  

</div>
