# Gemini API Setup Guide

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Run the setup script:**
   ```bash
   cd backend/python-api
   python setup_gemini.py
   ```

2. **Follow the prompts to enter your API key**

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

### Option 2: Manual Setup

1. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Update the .env file:**
   ```bash
   cd backend/python-api
   ```
   
   Edit the `.env` file and replace `your-gemini-api-key-here` with your actual API key:
   ```env
   GEMINI_API_KEY=your-actual-api-key-here
   GOOGLE_API_KEY=your-actual-api-key-here
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

## Verification

### Test the API

1. **Open your browser and go to:**
   ```
   http://localhost:8001/docs
   ```

2. **Try the `/api/parse` endpoint with a PDF file**

3. **Check the logs for:**
   ```
   Gemini 모델 초기화 완료: gemini-2.0-flash-exp
   ```

### Alternative Test

Run this Python script to test your configuration:

```python
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content("Hello! Please respond with 'API test successful'")
    print(f"✅ Response: {response.text}")
else:
    print("❌ No API key found")
```

## Troubleshooting

### Common Issues

1. **"Gemini API 키가 설정되지 않았습니다" Error:**
   - Check that your `.env` file exists
   - Verify the API key is correctly set (no extra spaces)
   - Ensure the `.env` file is in the correct directory (`backend/python-api/`)

2. **Import Error for google.generativeai:**
   ```bash
   pip install google-generativeai>=0.8.0
   ```

3. **API Key Invalid Error:**
   - Verify your API key is correct
   - Check that the API key has the necessary permissions
   - Try generating a new API key

4. **Model Not Found Error:**
   - The model name `gemini-2.0-flash-exp` might change
   - Check the latest model names in Google AI Studio
   - Update the `GEMINI_MODEL_NAME` in your `.env` file

### Environment Variables Priority

The system checks for API keys in this order:
1. Direct parameter to `QuestionParser(api_key="...")`
2. `settings.GEMINI_API_KEY` from `.env` file
3. `GEMINI_API_KEY` environment variable
4. `GOOGLE_API_KEY` environment variable

### File Locations

Make sure these files exist:
```
backend/python-api/
├── .env                    # Your API key configuration
├── setup_gemini.py        # Setup script
├── requirements.txt       # Dependencies
└── app/
    ├── main.py            # FastAPI app
    ├── core/
    │   └── config.py      # Settings configuration
    └── parsers/
        └── question_parser.py  # Gemini parser
```

## Support

If you encounter issues:

1. **Check the logs** when starting the server
2. **Run the setup script again:** `python setup_gemini.py`
3. **Verify your API key** at [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Check the FastAPI docs** at `http://localhost:8001/docs`

## API Usage Limits

- **Free tier:** 15 requests per minute
- **Rate limiting:** Built into the Google AI API
- **Quota monitoring:** Check your usage in Google AI Studio

## Security Notes

- ✅ `.env` file is included in `.gitignore`
- ✅ Never commit API keys to version control
- ✅ Use environment variables in production
- ✅ Rotate API keys regularly