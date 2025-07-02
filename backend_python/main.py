from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import MBartForConditionalGeneration, MBart50TokenizerFast
from langdetect import detect

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

lang_code_map = {
    "en": "en_XX", "fr": "fr_XX", "hi": "hi_IN", "es": "es_XX", "de": "de_DE",
    "ta": "ta_IN", "zh": "zh_CN", "ar": "ar_AR", "ru": "ru_RU", "ja": "ja_XX",
    "it": "it_IT", "pt": "pt_XX", "pl": "pl_PL", "tr": "tr_TR", "nl": "nl_XX",
    "sv": "sv_SE", "ko": "ko_KR", "fa": "fa_IR", "fi": "fi_FI", "he": "he_IL",
    "uk": "uk_UA", "vi": "vi_VN", "cs": "cs_CZ", "ro": "ro_RO"
}

class TranslationRequest(BaseModel):
    text: str
    target_langs: list
    source_lang: str = None  # Optional

model_name = "facebook/mbart-large-50-many-to-many-mmt"
tokenizer = MBart50TokenizerFast.from_pretrained(model_name)
model = MBartForConditionalGeneration.from_pretrained(model_name)

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
    src_code = lang_code_map.get(source_lang, "en_XX")
    tgt_code = lang_code_map.get(target_lang)

    if not tgt_code:
        return f"Unsupported target language: {target_lang}"

    tokenizer.src_lang = src_code
    encoded = tokenizer(text, return_tensors="pt")
    generated_tokens = model.generate(
        **encoded,
        forced_bos_token_id=tokenizer.lang_code_to_id[tgt_code],
        max_length=60,
        num_beams=4,
        early_stopping=True
    )
    return tokenizer.decode(generated_tokens[0], skip_special_tokens=True)

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
