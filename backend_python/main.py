from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from langdetect import detect

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

lang_code_map = {
    "en": "eng_Latn", "fr": "fra_Latn", "hi": "hin_Deva", "es": "spa_Latn", "de": "deu_Latn",
    "ta": "tam_Taml", "zh": "zho_Hans", "ar": "arb_Arab", "ru": "rus_Cyrl", "ja": "jpn_Jpan",
    "it": "ita_Latn", "pt": "por_Latn", "pl": "pol_Latn", "tr": "tur_Latn", "nl": "nld_Latn",
    "sv": "swe_Latn", "ko": "kor_Hang", "fa": "pes_Arab", "fi": "fin_Latn", "he": "heb_Hebr",
    "uk": "ukr_Cyrl", "vi": "vie_Latn", "cs": "ces_Latn", "ro": "ron_Latn"
}

class TranslationRequest(BaseModel):
    text: str
    target_langs: list
    source_lang: str = None 

# Load NLLB-200 model & tokenizer
model_name = "facebook/nllb-200-3.3B"  
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

lang_code_to_id = {code: tokenizer.convert_tokens_to_ids(code) for code in tokenizer.additional_special_tokens}

def detect_language(text):
    try:
        return detect(text)
    except:
        return "en"

def translate(text, target_lang, source_lang=None):
    text = text.strip()
    if not text:
        return "Empty input"

    source_lang = source_lang or detect_language(text)
    src_code = lang_code_map.get(source_lang, "eng_Latn")
    tgt_code = lang_code_map.get(target_lang)

    if not tgt_code:
        return f"Unsupported target language: {target_lang}"

    inputs = tokenizer(text, return_tensors="pt", padding=True)
    translated_tokens = model.generate(
        **inputs,
        forced_bos_token_id=lang_code_to_id[tgt_code],  
        max_length=200
    )
    return tokenizer.decode(translated_tokens[0], skip_special_tokens=True)

@app.post("/translate")
def get_translation(req: TranslationRequest):
    source_lang = req.source_lang or detect_language(req.text)
    output = {}
    for tgt in req.target_langs:
        try:
            result = translate(req.text, tgt, source_lang)
            output[tgt] = result
        except Exception as e:
            output[tgt] = f"Error: {str(e)}"
    return {
        "translations": output,
        "detected_lang": source_lang
    }
