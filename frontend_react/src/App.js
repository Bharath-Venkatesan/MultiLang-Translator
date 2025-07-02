  import React, { useState } from "react";
  import axios from "axios";
  import { franc } from "franc-min";
  import {iso6393} from "iso-639-3";
  import "./App.css";
  import { ToastContainer, toast } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  import TextField from "@mui/material/TextField";

  const languages = [
    { code: "ar", name: "العربية (Arabic)" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "cs", name: "Čeština (Czech)" },
    { code: "nl", name: "Nederlands (Dutch)" },
    { code: "en", name: "English (English)" },
    { code: "fi", name: "Suomi (Finnish)" },
    { code: "fr", name: "Français (French)" },
    { code: "de", name: "Deutsch (German)" },
    { code: "he", name: "עברית (Hebrew)" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "it", name: "Italiano (Italian)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "ko", name: "한국어 (Korean)" },
    { code: "fa", name: "فارسی (Persian)" },
    { code: "pl", name: "Polski (Polish)" },
    { code: "pt", name: "Português (Portuguese)" },
    { code: "ro", name: "Română (Romanian)" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "sv", name: "Svenska (Swedish)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "tr", name: "Türkçe (Turkish)" },
    { code: "uk", name: "Українська (Ukrainian)" },
    { code: "vi", name: "Tiếng Việt (Vietnamese)" },
    { code: "es", name: "Español (Spanish)" }
  ];


  const languageIcons = {
    en: "🇬🇧", hi: "🇮🇳", fr: "🇫🇷", es: "🇪🇸", de: "🇩🇪", ta: "🇮🇳", zh: "🇨🇳", ar: "🇸🇦",
    ru: "🇷🇺", ja: "🇯🇵", it: "🇮🇹", pt: "🇵🇹", pl: "🇵🇱", tr: "🇹🇷", nl: "🇳🇱", sv: "🇸🇪",
    ko: "🇰🇷", fa: "🇮🇷", fi: "🇫🇮", he: "🇮🇱", uk: "🇺🇦", vi: "🇻🇳", cs: "🇨🇿", ro: "🇷🇴"
  };

  function App() {
    const [text, setText] = useState("");
    const [targetLangs, setTargetLangs] = useState([]);
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(false);
    const [detectedLang, setDetectedLang] = useState("");

    const getLanguageNameFromFranc = (francCode) => {
      const lang = iso6393.find((l) => l.iso6393 === francCode);
      const iso1 = lang?.iso6391;
      const match = languages.find((l) => l.code === iso1);
      return match ? { name: match.name, code: match.code } : { name: lang?.name || "Unknown", code: "" };
    };

    const handleTextChange = (e) => {
      const input = e.target.value;
      setText(input);

      const code = franc(input);
      if (code !== "und") {
        const langObj = getLanguageNameFromFranc(code);
        setDetectedLang(langObj.code);
      } else {
        setDetectedLang("");
      }
    };

    const handleCheckboxChange = (e) => {
      const value = e.target.value;
      if (e.target.checked) {
        if (targetLangs.length < 5) {
          setTargetLangs([...targetLangs, value]);
        } else {
          toast.warning("Unable to select more than 5 languages");
          e.target.checked = false;
        }
      } else {
        setTargetLangs(targetLangs.filter((lang) => lang !== value));
      }
    };

    
    const handleTranslate = async () => {
    if (!text || targetLangs.length === 0) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/translate", {
        text,
        target_langs: targetLangs
      });
      setTranslations(response.data.translations || {});
      setDetectedLang(response.data.detected_lang || "");
    } catch (error) {
      toast.error("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


    const handleCopy = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");

    };

    const handleSpeak = (text, langCode) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    };

    return (
    <div className="container">
      <h1>Multi-Language Translator</h1>
      <TextField
    label="Enter text to translate"
    multiline
    minRows={4}
    maxRows={10}
    fullWidth
    value={text}
    onChange={handleTextChange}
    variant="outlined"
  />
      {detectedLang && (
        <div className="detected">
          Detected Language: {languages.find(l => l.code === detectedLang)?.name || "Unknown"}
        </div>
      )}
      <div className="checkbox-list">
        {languages.map((lang) => (
          <label key={lang.code}>
            <input
              type="checkbox"
              value={lang.code}
              onChange={handleCheckboxChange}
              checked={targetLangs.includes(lang.code)}
            />
            {languageIcons[lang.code]} {lang.name}
          </label>
        ))}
      </div>

      <button onClick={handleTranslate} disabled={loading}>
        {loading ? "Translating..." : "Translate"}
      </button>

      <div className="results">
        {Object.entries(translations).map(([lang, result]) => (
          <div className="card" key={lang}>
            <h3>{languageIcons[lang]} {languages.find(l => l.code === lang)?.name}</h3>
            <p>{result}</p>
            <div className="card-buttons">
              <button onClick={() => handleCopy(result)}>Copy To Clipboard</button>
              <button onClick={() => handleSpeak(result, lang)}>Read</button>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
  }

  export default App;
