# CampusON Python API - Gemini Integration

This directory contains the Python FastAPI backend with Gemini 2.0 Flash integration for PDF parsing and question extraction.

## 🚀 Quick Start

### 1. Gemini API Setup

#### Option A: Automated Setup (Recommended)
```bash
# Run the setup script
python setup_gemini.py

# Follow the prompts to enter your API key
```

#### Option B: Manual Setup
1. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Configure environment variables:**
   ```bash
   # Edit the .env file
   GEMINI_API_KEY=your-actual-api-key-here
   ```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Test Configuration
```bash
# Test your Gemini API setup
python test_gemini_api.py
```

### 4. Start the Server
```bash
uvicorn app.main:app --reload --port 8001
```

### 5. Verify Installation
- Open: http://localhost:8001/docs
- Test the `/api/parse` endpoint with a PDF file

## 📁 Project Structure

```
backend/python-api/
├── .env                    # Environment variables (create this)
├── .env.example           # Example environment file
├── requirements.txt       # Python dependencies
├── setup_gemini.py       # Automated setup script
├── test_gemini_api.py    # API test script
├── GEMINI_SETUP.md       # Detailed setup guide
├── app/
│   ├── main.py           # FastAPI application
│   ├── core/
│   │   └── config.py     # Configuration settings
│   └── parsers/
│       └── question_parser.py  # Gemini-based parser
└── tests/
    └── test_parser.py    # Parser tests
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL_NAME=gemini-2.0-flash-exp

# Alternative API key name (for compatibility)
GOOGLE_API_KEY=your-gemini-api-key-here

# Database Configuration
DATABASE_URL=sqlite:///./app.db

# Application Settings
DEBUG=True
PORT=8001

# CORS Settings
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
ALLOWED_HOSTS=["*"]

# Optional: Poppler Path (for PDF processing)
# POPPLER_PATH=C:\path\to\poppler\bin

# Optional: OpenAI API Key (if you plan to use OpenAI features)
# OPENAI_API_KEY=your-openai-api-key-here
```

### Settings Priority

The system checks for API keys in this order:
1. Direct parameter: `QuestionParser(api_key="...")`
2. `settings.GEMINI_API_KEY` from `.env` file
3. `GEMINI_API_KEY` environment variable
4. `GOOGLE_API_KEY` environment variable

## 🧪 Testing

### Basic API Test
```bash
python test_gemini_api.py
```

### Parser Tests
```bash
cd tests
python test_parser.py
```

### Manual Testing
```python
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash-exp')
response = model.generate_content("Hello!")
print(response.text)
```

## 📋 API Endpoints

### Main Endpoints

#### `POST /api/parse`
Parses uploaded PDF files using Gemini AI.
Automatically ingests parsed questions into the AI knowledge base and saves them into the DB by default.

**Request:**
```bash
curl -X POST "http://localhost:8001/api/parse" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your-file.pdf"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question_number": 1,
        "content": "문제 내용",
        "options": {
          "1": "선택지 1",
          "2": "선택지 2",
          "3": "선택지 3",
          "4": "선택지 4",
          "5": "선택지 5"
        },
        "correct_answer": "3",
        "subject": "과목명",
        "area_name": "영역명",
        "difficulty": "중",
        "year": 2024
      }
    ]
  }
}
```

### AI/Quiz/Community (Base scaffolding)

- `POST /api/ai/ingest` — ingest parsed questions into a simple knowledge table
  - body: `{ "questions": [ { number, content, options, description?, subject?, area_name?, year? } ] }`
- `POST /api/ai/generate-questions` — generate sample questions via Gemini (fallback placeholders without key)
  - body: `{ "topic": "string", "count": 5, "difficulty": "하|중|상" }`
- `POST /api/community/ai/chat` — lightweight community AI chat
  - body: `{ "messages": [{ role: "user", content: "..." }], "context": "optional" }`
- `POST /api/quiz/create` — create a quiz from existing DB question IDs
- `GET /api/quiz/{quiz_id}` — fetch quiz items
- `POST /api/quiz/{quiz_id}/submit` — submit answers `{ answers: { [questionId]: "1|2|3|4" }, student_id?: string }`
- `GET /api/notices/proxy?url=...` — fetch raw HTML for school notices if iframe is blocked

### RAG (FAISS)

- `GET /api/ai/rag/status` — check total chunks, FAISS availability, latest index metadata
- `POST /api/ai/rag/ingest` — ingest arbitrary documents  
  - body: `{ documents: [{ text: string, meta?: Record<string, any> }], chunk_size?: number, chunk_overlap?: number, default_meta?: object, build_index?: boolean }`
- `POST /api/ai/rag/upload` — upload PDF/text files (multipart form)  
  - form fields: `file`, optional `department`, `course`, `chunk_size`, `chunk_overlap`, `build_index`
- `POST /api/ai/rag/build` — build FAISS index from `knowledge_chunks` (requires embeddings)
- `POST /api/ai/rag/query` — query similar chunks `{ query: string, top_k?: number }`

Embeddings
- Uses OpenAI embeddings if `OPENAI_API_KEY` is set (default `text-embedding-3-small`).
- Without `OPENAI_API_KEY`, FAISS indexing is skipped and query falls back to SQL LIKE.

## 🔍 Troubleshooting

### Common Issues

#### 1. "Gemini API 키가 설정되지 않았습니다" Error
**Solution:**
- Check that your `.env` file exists
- Verify the API key is correctly set (no extra spaces)
- Ensure the `.env` file is in the correct directory

#### 2. Import Error for google.generativeai
**Solution:**
```bash
pip install google-generativeai>=0.8.0
```

Query params:
- `auto_ingest` (default: `true`) — when true, parsed questions are indexed into the knowledge base automatically.
- `auto_save` (default: `true`) — when true, parsed questions are saved into the DB `questions` table automatically.

#### 3. API Key Invalid Error
**Solution:**
- Verify your API key is correct
- Check API key permissions in Google AI Studio
- Try generating a new API key

#### 4. Model Not Found Error
**Solution:**
- Check the latest model names in Google AI Studio
- Update `GEMINI_MODEL_NAME` in your `.env` file
- Try using `gemini-pro` if `gemini-2.0-flash-exp` is not available

#### 5. PDF Processing Errors
**Problem:** "Unable to get page count. Is poppler installed and in PATH?"

**Quick Fix:**
```bash
# Automatic installation (recommended)
python install_poppler.py

# Or manual test and fix
python fix_poppler.py

# Verify installation
python test_poppler.py
```

**Manual Solution:**
- Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases
- Extract to any location (e.g., `C:\poppler\`)
- Add to your `.env` file: `POPPLER_PATH=C:\poppler\Library\bin`
- Restart your application

**Alternative Installations:**
- **Conda:** `conda install -c conda-forge poppler`
- **Chocolatey:** `choco install poppler`
- **System PATH:** Add poppler/bin to Windows PATH environment variable

#### 6. Rate Limiting Errors
**Solution:**
- The free tier has 15 requests per minute
- Wait between requests or upgrade your quota
- Monitor usage in Google AI Studio

### Debug Steps

1. **Check configuration:**
   ```bash
   python test_gemini_api.py
   ```

2. **Verify environment:**
   ```python
   import os
   from dotenv import load_dotenv
   load_dotenv()
   print(f"API Key: {os.getenv('GEMINI_API_KEY')[:10]}...")
   ```

3. **Test FastAPI directly:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   # Visit: http://localhost:8001/docs
   ```

4. **Check logs:**
   - Look for "Gemini 모델 초기화 완료" message
   - Check for any error messages in console

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Question Parser Features

- **Multi-format support**: PDF, Excel, Text files
- **AI-powered extraction**: Uses Gemini 2.0 Flash
- **Korean exam format**: Optimized for Korean exam questions
- **Automatic validation**: 22-question limit and format validation
- **Error handling**: Graceful fallbacks and error reporting

## 🔒 Security

- ✅ API keys are stored in `.env` (not committed to git)
- ✅ Environment variable support for production
- ✅ CORS configuration for frontend integration
- ✅ Input validation and sanitization

## 📞 Support

For issues and questions:

1. **Check this documentation**
2. **Run diagnostics**: `python test_gemini_api.py`
3. **Check logs** when starting the server
4. **Visit**: http://localhost:8001/docs for API testing

## 🔗 Related Links

- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get your API key
- [Gemini API Documentation](https://ai.google.dev/docs) - Official docs
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Framework docs
