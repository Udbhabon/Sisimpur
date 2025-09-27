import google.generativeai as genai
from dotenv import load_dotenv
import json
import os


load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

def evaluate_answer(user_answer, current_question):
    """
    Evaluate whether the user's answer is correct.
    - MULTIPLECHOICE: compares selected option key against the correct key, robust to new/old formats
    - SHORT: uses LLM rubric scoring (kept as-is)
    Returns (is_correct: bool, debug_logs: list[str])
    """
    debug_logs = []
    is_correct = False

    # Normalize user input
    user_raw = user_answer if user_answer is not None else ""
    user_key_norm = user_raw.strip()

    debug_logs.append(
        f"DEBUG: Eval start | Type='{current_question.question_type}', User='{user_raw}', "
        f"CorrectOption='{current_question.correct_option}', ExpectedAnswer='{current_question.answer}'"
    )

    if current_question.question_type == "MULTIPLECHOICE":
        # Get options in unified format
        try:
            formatted_options = current_question.get_formatted_options()
        except Exception:
            formatted_options = []

        # Build lookup maps
        key_set = {str(opt.get("key", "")).strip(): opt for opt in formatted_options}
        text_to_key = {str(opt.get("text", "")).strip().lower(): str(opt.get("key", "")).strip() for opt in formatted_options}

        # Determine the correct key according to new JSON format
        correct_key = None

        # Priority 1: current_question.correct_option matches a key
        if current_question.correct_option:
            co = str(current_question.correct_option).strip()
            # Handle values like "A)", "ক)", etc.
            co_key_candidate = co.split(')')[0].strip() if ')' in co else co
            if co_key_candidate in key_set:
                correct_key = co_key_candidate
                debug_logs.append(f"DEBUG: Correct key via correct_option as key: '{correct_key}'")
            else:
                # Maybe correct_option stored as full option text
                co_text = co
                co_text_norm = co_text.split(')', 1)[1].strip().lower() if ')' in co_text else co_text.lower()
                if co_text_norm in text_to_key:
                    correct_key = text_to_key[co_text_norm]
                    debug_logs.append(f"DEBUG: Correct key via correct_option text match -> '{correct_key}'")

        # Priority 2: fallback to matching provided canonical answer text
        if not correct_key and current_question.answer:
            ans_norm = str(current_question.answer).strip().lower()
            if ans_norm in text_to_key:
                correct_key = text_to_key[ans_norm]
                debug_logs.append(f"DEBUG: Correct key via answer text match -> '{correct_key}'")

        # If still unknown, last resort: accept exact user text match against any key
        if not correct_key and user_key_norm in key_set:
            # We don't know the correct key; cannot assert correctness reliably
            debug_logs.append("WARN: Correct key unknown; cannot verify. Marking incorrect by default.")
            is_correct = False
        else:
            # Compare normalized keys
            is_correct = (str(user_key_norm).strip().lower() == str(correct_key).strip().lower()) if correct_key is not None else False
            debug_logs.append(
                f"DEBUG: Compare user_key='{user_key_norm}' vs correct_key='{correct_key}' => {is_correct}"
            )

    else:  # Short answer
        # Create the JSON template as a separate string to avoid f-string formatting issues
        json_template = """{
            "score": <int out of 20>,
            "justification": "<why this score was given>",
            "improvement": "<how to improve to get 20>"
        }"""
        
        prompt = (
            f"You are an exam evaluator. Evaluate the student's answer strictly and return JSON only.\n\n"
            f"Question: {current_question.question}\n"
            f"Expected Answer: {current_question.answer}\n"
            f"User's Answer: {user_raw}\n\n"
            f"Return a JSON object like this:\n"
            f"{json_template}"
        )
        try:
            model = genai.GenerativeModel("models/gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw_reply = response.text.strip()
            debug_logs.append(
                f"DEBUG: Raw reply from model: {raw_reply}"
            )

            try:
                feedback = json.loads(raw_reply)
                score = int(feedback.get("score", 0))
                is_correct = score >= 15
                debug_logs.append(f"DEBUG: Parsed score = {score}, is_correct = {is_correct}")
            except json.JSONDecodeError as je:
                debug_logs.append(f"ERROR: JSON decode failed: {je}")
                is_correct = False

        except Exception as e:
            debug_logs.append(f"ERROR: Gemini API error: {e}")
            is_correct = False

    debug_logs.append(f"DEBUG: Final is_correct = {is_correct}")
    return is_correct, debug_logs
