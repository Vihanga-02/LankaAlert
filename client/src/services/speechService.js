class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voices = [];
    
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
      this.recognition.lang = 'en-US'; // Primary language
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

  // Get best voice for text-to-speech
  getBestVoice() {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Prefer English voices
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en') && voice.localService
    );

    if (englishVoices.length > 0) {
      return englishVoices[0];
    }

    // Fallback to any available voice
    return this.voices[0] || null;
  }

  // Start voice recognition
  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.recognition.onresult = (event) => {
      const result = event.results[0][0];
      if (result.confidence > 0.5) {
        onResult(result.transcript);
      } else {
        onError('Speech not clear enough. Please try again.');
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
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
      onError('Failed to start speech recognition');
      return false;
    }
  }

  // Stop voice recognition
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Convert text to speech
  speak(text, onStart, onEnd, onError) {
    if (!this.synthesis) {
      onError?.('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getBestVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.9;
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