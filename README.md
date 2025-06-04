# 🧠 Sisimpur: AI-Powered Exam Prep from Any Document

Sisimpur is an open-source, AI-driven tool that instantly converts PDFs, Word documents, and notes into exam-style questions — from multiple-choice questions (MCQs) to flashcards — helping students revise smarter and educators automate question creation.

  🚀 **Try it now** →
   [sisimpur.onrender.com](https://sisimpur.onrender.com/)
   
  📚 **Built with**: Django · PostgreSQL · Tailwind · Langchain ·
   HuggingFace Transformers

---

## ✨ Features

* ✅ **AI Question Generator**: Instantly turn your docs into MCQs, flashcards, or short answers.
* 🧠 **Quiz Modes**: Practice by chapter, concept, or randomly with scoring and explanations.
* 🏆 **Progress Tracker**: Personalized dashboard to track learning streaks and performance.
* 🎯 **Leaderboard & Gamification**: Compete with friends and stay motivated.
* 🔒 **Privacy First**: Your documents stay yours. No third-party cloud uploads.

---

## 🛠️ Tech Stack

| Layer       | Tech Used                                                    |
| ----------- | ------------------------------------------------------------ |
| Backend     | Django · PostgreSQL · REST Framework                         |
| Frontend    | HTML · CSS · JS                       |
| AI Models   | HuggingFace Transformers · Langchain · OpenAI API (fallback) |
| DevOps      | Docker · GitHub Actions · Heroku/Render Deployment           |
| PDF Parsing | PyMuPDF · Docx2txt · PDFPlumber                              |

---

## 🧩 Architecture

```plaintext
+--------------+       +----------------+       +-------------------+
| User Uploads | --->  | PDF/Doc Parser | --->  | AI Question Engine |
+--------------+       +----------------+       +-------------------+
       |                          |                       |
       |                          V                       V
       |                 Cleaned Paragraphs     Generated Questions
       |                          |                       |
       +--------------------------+-----------------------+
                                   |
                                   V
                         +------------------+
                         | Django API Layer |
                         +------------------+
                                   |
                                   V
                          +----------------+
                          | Frontend UI    |
                          | (Quiz, Track)  |
                          +----------------+
```

---

## 📦 Installation (Local Dev)

```bash
# Clone the repo
git clone https://github.com/udbhabon/sisimpur.git && cd sisimpur

# Create virtual environment
python -m venv venv

# Active virtual environment (If Linux) 
source venv/bin/activate

# Active virtual environment (If Windows) 
venv\Scripts\activate

# Install dependencies
python.exe -m pip install --upgrade pip && pip install -r requirements.txt

# Copy .env.example to .env and fill in your credentials
cp .env.example .env

# Setup DB
python manage.py migrate

# Run server
python manage.py runserver

#Run test_harness.py:
python3 test_harness.py "your-path-to-document" "your-path-to-question-and-answer-doc" --runs "number-of-trials"
```

---

## 🧪 API Overview

| Endpoint        | Method | Description                    |
| --------------- | ------ | ------------------------------ |
| `/upload/`      | POST   | Uploads and parses PDF/Doc     |
| `/generate/`    | POST   | Generates questions using AI   |
| `/quiz/`        | GET    | Returns quiz questions         |
| `/score/`       | POST   | Submits and stores quiz result |
| `/leaderboard/` | GET    | Returns top scores             |

---

## 🤝 Contributing

We welcome contributors of all levels! Here's how you can help:

* 🐞 Bug Fixes / Refactoring
* 🌐 Add language support for Hindi, Bengali, etc.
* 🧪 Add more quiz types (true/false, paragraph-based)
* 💡 Improve AI output formatting

👉 See our [Contribution Guide](CONTRIBUTING.md)

---

## 🔒 License

MIT License © 2025 Udbhabon

---

## 💬 Support & Community

Have questions or ideas?
Join our [Discord](https://discord.gg/sisimpur) · Submit issues · Tweet with hashtag `#SisimpurAI`

---

Would you like help creating a **matching CONTRIBUTING.md**, **API docs**, or a **landing page** for this project?
