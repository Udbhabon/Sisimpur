# 🚀 Sisimpur API Requirements Report

## ✅ Updated API Spec (Single Endpoint)

- Single endpoint: `POST https://rsegh.millenniumonline.tv/webhook/sisimpur?event=mcq_question`
- Upload format: multipart/form-data with binary `file`; or JSON with `text`
- Fields sent (form-data or JSON):
  - `question_number`: e.g., `"optimal"` or `"10"`
  - `language`: `"auto" | "english" | "bengali"`
  - `question_type`: `"multiple_choice" | "short_answer"`
- Response: `{ success: true, data: { questions: [...], metadata?: {...} } }`
- All analysis, extraction, detection are handled inside n8n for `event=mcq_question`.

Example (multipart):
```bash
curl -X POST "https://rsegh.millenniumonline.tv/webhook/sisimpur?event=mcq_question" \
  -F "file=@/path/to/doc.pdf" \
  -F "question_number=optimal" \
  -F "language=auto" \
  -F "question_type=multiple_choice"
```

Example (JSON text):
```bash
curl -X POST "https://rsegh.millenniumonline.tv/webhook/sisimpur?event=mcq_question" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "...",
    "question_number": "10",
    "language": "english",
    "question_type": "short_answer"
  }'
```


## 📋 **Executive Summary**

This report outlines the complete API requirements for replacing the existing AI processing architecture in the Sisimpur project with external API calls. The refactoring has been completed, and all AI processing now goes through placeholder API endpoints that need to be implemented in n8n.

---

## 🎯 **Refactoring Overview**

### **What Was Removed:**
- ❌ Local AI processing engine (`apps/brain/brain_engine/`)
- ❌ Gemini API integration
- ❌ Local OCR processing
- ❌ Local question generation
- ❌ Complex prompt management system
- ❌ Document type detection
- ❌ Image processing dependencies

### **What Was Added:**
- ✅ API configuration system (`apps/brain/api_config.py`)
- ✅ API service layer (`apps/brain/api_service.py`)
- ✅ Simplified API processor (`apps/brain/api_processor.py`)
- ✅ Enhanced frontend with API logging
- ✅ Network activity monitoring
- ✅ Improved error handling and user feedback

---

## 🌐 **Required API Endpoints**

### **1. Document Processing (Combined Endpoint)**
**Endpoint:** `POST /api/v1/document/process`
**Purpose:** Process document and generate Q&A pairs in one call
**Timeout:** 5 minutes

#### **Request Format:**
```json
{
  "file": {
    "file_name": "document.pdf",
    "file_content": "base64_encoded_content",
    "file_type": "application/pdf",
    "file_size": 1024000
  },
  "num_questions": 10,
  "language": "en",
  "question_type": "multiple_choice",
  "options": {
    "generate_optimal": false,
    "preserve_formatting": true,
    "include_metadata": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "What is the main topic of this document?",
        "answer": "The main topic is artificial intelligence",
        "question_type": "multiple_choice",
        "options": ["AI", "Machine Learning", "Deep Learning", "Neural Networks"],
        "correct_option": "AI",
        "confidence_score": 0.95,
        "explanation": "This is clearly stated in the first paragraph",
        "difficulty": "medium",
        "topic": "Introduction",
        "metadata": {
          "source_page": 1,
          "extraction_method": "api"
        }
      }
    ],
    "metadata": {
      "total_questions": 10,
      "processing_time": 45.2,
      "language_detected": "en",
      "document_type": "pdf",
      "is_question_paper": false
    }
  }
}
```

---

### **2. Text Extraction Endpoints**

#### **2.1 PDF Text Extraction**
**Endpoint:** `POST /api/v1/extract/pdf`
**Purpose:** Extract text from PDF documents
**Timeout:** 2 minutes

#### **Request Format:**
```json
{
  "file": {
    "file_name": "document.pdf",
    "file_content": "base64_encoded_content",
    "file_type": "application/pdf",
    "file_size": 1024000
  },
  "language": "en",
  "options": {
    "preserve_formatting": true,
    "detect_question_paper": true,
    "include_metadata": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "extracted_text": "Full extracted text content...",
    "metadata": {
      "language_detected": "en",
      "is_question_paper": false,
      "page_count": 5,
      "word_count": 1250,
      "extraction_method": "api_ocr"
    }
  }
}
```

#### **2.2 Image Text Extraction**
**Endpoint:** `POST /api/v1/extract/image`
**Purpose:** Extract text from image files
**Timeout:** 2 minutes

#### **Request Format:**
```json
{
  "file": {
    "file_name": "image.jpg",
    "file_content": "base64_encoded_content",
    "file_type": "image/jpeg",
    "file_size": 512000
  },
  "language": "en",
  "options": {
    "preserve_formatting": true,
    "detect_question_paper": true,
    "include_metadata": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "extracted_text": "Text extracted from image...",
    "metadata": {
      "language_detected": "en",
      "is_question_paper": true,
      "confidence_score": 0.92,
      "extraction_method": "api_ocr"
    }
  }
}
```

#### **2.3 Combined Text Extraction**
**Endpoint:** `POST /api/v1/extract/extract`
**Purpose:** Extract text from any document type
**Timeout:** 2 minutes

---

### **3. Question Generation Endpoints**

#### **3.1 Generate Specific Number of Questions**
**Endpoint:** `POST /api/v1/generate/questions`
**Purpose:** Generate specific number of Q&A pairs
**Timeout:** 3 minutes

#### **Request Format:**
```json
{
  "text": "Source text content...",
  "num_questions": 10,
  "language": "en",
  "question_type": "multiple_choice",
  "is_question_paper": false,
  "options": {
    "preserve_formatting": true,
    "include_confidence_scores": true,
    "generate_distractors": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "What is the main topic?",
        "answer": "Artificial Intelligence",
        "question_type": "multiple_choice",
        "options": ["AI", "ML", "DL", "NN"],
        "correct_option": "AI",
        "confidence_score": 0.95
      }
    ],
    "metadata": {
      "total_questions": 10,
      "generation_time": 30.5,
      "language": "en",
      "question_type": "multiple_choice"
    }
  }
}
```

#### **3.2 Auto-Generate Optimal Questions**
**Endpoint:** `POST /api/v1/generate/questions/auto`
**Purpose:** Generate optimal number of Q&A pairs
**Timeout:** 3 minutes

#### **Request Format:**
```json
{
  "text": "Source text content...",
  "language": "en",
  "question_type": "multiple_choice",
  "is_question_paper": false,
  "options": {
    "preserve_formatting": true,
    "include_confidence_scores": true,
    "generate_distractors": true,
    "auto_optimize": true
  }
}
```

---

### **4. Document Analysis Endpoints**

#### **4.1 Document Analysis**
**Endpoint:** `POST /api/v1/analyze/analyze`
**Purpose:** Analyze document type and metadata
**Timeout:** 1 minute

#### **Request Format:**
```json
{
  "file": {
    "file_name": "document.pdf",
    "file_content": "base64_encoded_content",
    "file_type": "application/pdf",
    "file_size": 1024000
  },
  "options": {
    "detect_language": true,
    "detect_question_paper": true,
    "extract_metadata": true,
    "analyze_structure": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "document_type": "pdf",
    "language_detected": "en",
    "is_question_paper": false,
    "page_count": 5,
    "word_count": 1250,
    "structure": {
      "has_headings": true,
      "has_paragraphs": true,
      "has_lists": false
    },
    "metadata": {
      "creation_date": "2024-01-15",
      "author": "Unknown",
      "title": "Sample Document"
    }
  }
}
```

#### **4.2 Question Paper Detection**
**Endpoint:** `POST /api/v1/analyze/detect-question-paper`
**Purpose:** Detect if document is a question paper
**Timeout:** 30 seconds

#### **Request Format:**
```json
{
  "file": {
    "file_name": "exam.pdf",
    "file_content": "base64_encoded_content",
    "file_type": "application/pdf",
    "file_size": 512000
  },
  "options": {
    "confidence_threshold": 0.7,
    "analyze_structure": true
  }
}
```

#### **Response Format:**
```json
{
  "success": true,
  "data": {
    "is_question_paper": true,
    "confidence_score": 0.85,
    "evidence": [
      "Contains numbered questions",
      "Has multiple choice options",
      "Includes answer choices"
    ],
    "metadata": {
      "question_count": 25,
      "has_multiple_choice": true,
      "has_short_answer": false
    }
  }
}
```

---

## 🔧 **API Configuration**

### **Base URLs (Placeholder)**
```python
API_BASE_URLS = {
    'document_processing': 'https://api.sisimpur.com/v1/document',
    'text_extraction': 'https://api.sisimpur.com/v1/extract',
    'question_generation': 'https://api.sisimpur.com/v1/generate',
    'document_analysis': 'https://api.sisimpur.com/v1/analyze',
}
```

### **Headers**
```python
API_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Sisimpur-Brain-Engine/1.0',
    'Accept': 'application/json',
}
```

### **Authentication (Optional)**
```python
API_AUTH = {
    'api_key': 'your_api_key_here',
    'api_secret': 'your_api_secret_here',
}
```

---

## 📊 **Data Flow Examples**

### **Example 1: PDF Document Processing**
1. **User uploads PDF** → Frontend shows loading state
2. **API Call:** `POST /api/v1/document/process`
3. **Request:** PDF file + configuration
4. **Response:** Generated Q&A pairs
5. **Frontend:** Shows success with API log
6. **Database:** Stores Q&A pairs

### **Example 2: Text Input Processing**
1. **User enters text** → Frontend shows loading state
2. **API Call:** `POST /api/v1/generate/questions`
3. **Request:** Text content + configuration
4. **Response:** Generated Q&A pairs
5. **Frontend:** Shows success with API log
6. **Database:** Stores Q&A pairs

---

## 🎨 **Frontend Enhancements**

### **API Logging Features**
- ✅ Real-time API activity log
- ✅ Network request/response monitoring
- ✅ Error tracking with emojis
- ✅ Progress indicators
- ✅ Success/failure notifications

### **Loading States**
- ✅ ChatGPT-style loading animation
- ✅ Progress bar with status messages
- ✅ API connection indicators
- ✅ Processing stage updates

---

## 🚨 **Error Handling**

### **API Error Responses**
```json
{
  "success": false,
  "error": "API Error: 500 - Internal Server Error",
  "status_code": 500,
  "message": "❌ API service error. Please try again later."
}
```

### **Error Types Handled**
- ⏰ API timeout errors
- 🌐 Network connection errors
- 📁 File size limit errors
- 📄 Unsupported format errors
- 🤖 Question generation failures

---

## 📈 **Performance Considerations**

### **Timeouts**
- Document Processing: 5 minutes
- Text Extraction: 2 minutes
- Question Generation: 3 minutes
- Document Analysis: 1 minute

### **File Size Limits**
- Maximum file size: 50MB
- Chunk size: 1MB for uploads
- Supported formats: PDF, JPG, PNG, TXT

### **Retry Logic**
- Maximum retries: 3
- Retry delay: 1 second (exponential backoff)
- Connection error handling

---

## 🔄 **Migration Checklist**

### **Completed Tasks:**
- ✅ Removed old AI processing engine
- ✅ Created API configuration system
- ✅ Implemented API service layer
- ✅ Updated Django views
- ✅ Enhanced frontend with logging
- ✅ Updated requirements.txt
- ✅ Added error handling
- ✅ Implemented loading states

### **Next Steps for n8n Implementation:**
1. **Set up n8n workflows** for each API endpoint
2. **Configure API endpoints** with actual URLs
3. **Test API responses** with sample data
4. **Update API configuration** with real endpoints
5. **Deploy and test** the complete system

---

## 📝 **API Testing Examples**

### **Test Document Processing**
```bash
curl -X POST https://api.sisimpur.com/v1/document/process \
  -H "Content-Type: application/json" \
  -d '{
    "file": {
      "file_name": "test.pdf",
      "file_content": "base64_content_here",
      "file_type": "application/pdf",
      "file_size": 1024000
    },
    "num_questions": 5,
    "language": "en",
    "question_type": "multiple_choice"
  }'
```

### **Test Question Generation**
```bash
curl -X POST https://api.sisimpur.com/v1/generate/questions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence is the simulation of human intelligence in machines.",
    "num_questions": 3,
    "language": "en",
    "question_type": "multiple_choice"
  }'
```

---

## 🎯 **Summary**

The Sisimpur project has been successfully refactored to use external API calls instead of local AI processing. All the necessary API endpoints, request/response formats, and frontend enhancements have been implemented. The system is now ready for n8n integration with the provided API specifications.

**Key Benefits:**
- 🚀 Faster processing through external APIs
- 🔧 Easier maintenance and updates
- 📊 Better monitoring and logging
- 🌐 Scalable architecture
- 💰 Reduced local resource usage

**Ready for n8n Implementation!** 🎉
