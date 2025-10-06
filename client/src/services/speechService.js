class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voices = [];
    this.currentLanguage = 'en-US'; // Default language
    
    this.initializeSpeechRecognition();
    this.loadVoices();
  }

  // Initialize speech recognition
  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new window.SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.currentLanguage;
      this.recognition.maxAlternatives = 1;
    }
  }

  // Load available voices
  loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices();
    };

    updateVoices();
    if (this.synthesis.addEventListener) {
      this.synthesis.addEventListener('voiceschanged', updateVoices);
    }
  }

  // Get best voice for text-to-speech based on language
  getBestVoice(language = 'en') {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Try to find a voice for the specific language
    const languageVoices = this.voices.filter(voice => 
      voice.lang.startsWith(language) && voice.localService
    );

    if (languageVoices.length > 0) {
      return languageVoices[0];
    }

    // Fallback to English voices
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en') && voice.localService
    );

    if (englishVoices.length > 0) {
      return englishVoices[0];
    }

    // Fallback to any available voice
    return this.voices[0] || null;
  }

  // Detect language from text
  detectLanguage(text) {
    // Check for Sinhala characters
    const sinhalaRegex = /[\u0D80-\u0DFF]/;
    if (sinhalaRegex.test(text)) {
      return 'si';
    }
    return 'en';
  }

  // Set language for speech recognition
  setLanguage(language) {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Start voice recognition
  startListening(onResult, onError, onEnd, language = 'en-US') {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }

    // Set language for recognition
    this.recognition.lang = language;
    this.currentLanguage = language;
    
    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      console.log('Speech recognition result:', event);
      
      if (event.results && event.results.length > 0) {
        // Get the final result
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          const confidence = lastResult[0].confidence || 0.5;
          
          console.log('Speech recognized:', transcript, 'Confidence:', confidence);
          
          if (transcript && transcript.length > 0) {
            onResult(transcript);
          } else {
            onError('No speech detected. Please try again.');
          }
        }
      } else {
        onError('No speech detected. Please try again.');
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.error('Speech recognition error:', event);
      
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check microphone permissions and try again.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was interrupted. Please try again.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported. Please try with English.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      
      onError('Speech recognition not available. Please try typing your message.');
      return false;
    }
  }

  // Stop voice recognition
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Convert text to speech with Sinhala support
  async speak(text, onStart, onEnd, onError) {
    if (!this.synthesis) {
      onError?.('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Detect language and get appropriate voice
    const detectedLanguage = this.detectLanguage(text);
    
    // For Sinhala text, try to use Gemini API for better pronunciation
    if (detectedLanguage === 'si') {
      try {
        const translatedText = await this.translateSinhalaToEnglish(text);
        if (translatedText && translatedText !== text) {
          // Use translated text for better speech synthesis
          utterance.text = `${translatedText} (Original: ${text})`;
        }
      } catch (error) {
        console.log('Translation failed, using original text:', error);
      }
    }
    
    const voice = this.getBestVoice(detectedLanguage);
    
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Fallback language setting
      utterance.lang = detectedLanguage === 'si' ? 'en-US' : 'en-US'; // Use English for Sinhala fallback
    }
    
    utterance.rate = 0.8; // Slower for better understanding
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (event) => {
      onError?.(event.error);
    };

    this.synthesis.speak(utterance);
  }

  // Translate Sinhala text to English using Gemini API for better TTS
  async translateSinhalaToEnglish(sinhalaText) {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this Sinhala text to English for text-to-speech purposes. Only return the English translation, nothing else: "${sinhalaText}"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      return translatedText || sinhalaText;
    } catch (error) {
      console.error('Translation error:', error);
      return sinhalaText; // Return original text if translation fails
    }
  }

  // Stop speech synthesis
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Check if browser supports speech features
  isSupported() {
    return {
      recognition: !!this.recognition,
      synthesis: !!this.synthesis
    };
  }
}

export default new SpeechService();