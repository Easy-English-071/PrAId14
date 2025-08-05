// DOM Elements
const textInput = document.getElementById('text-input');
const accentSelect = document.getElementById('accent-select');
const transcribeBtn = document.getElementById('transcribe-btn');
const listenNaturalBtn = document.getElementById('listen-natural-btn');
const listenClearBtn = document.getElementById('listen-clear-btn');
const recordBtn = document.getElementById('record-btn');
const listenAgainBtn = document.getElementById('listen-again-btn');
const randomPracticeBtn = document.getElementById('random-practice-btn');
const controlsSection = document.getElementById('controls-section');
const loader = document.getElementById('loader');
const simpleIpaText = document.getElementById('simple-ipa-text');
const detailedIpaText = document.getElementById('detailed-ipa-text');
const analysisResults = document.getElementById('analysis-results');
const overallScore = document.getElementById('overall-score');
const phonemeAnalysis = document.getElementById('phoneme-analysis');
const stressAnalysis = document.getElementById('stress-analysis');
const practiceSuggestions = document.getElementById('practice-suggestions');
const suggestionLinks = document.getElementById('suggestion-links');
const messageBox = document.getElementById('message-box');
const waveformContainer = document.getElementById('waveform-container');
const waveformEl = document.getElementById('waveform');
const replayAudio = document.getElementById('replay-audio');
const funFactEl = document.getElementById('fun-fact');
const showMoreBtn = document.getElementById('show-more-btn');
const advancedAnalysis = document.getElementById('advanced-analysis');
const intonationAnalysis = document.getElementById('intonation-analysis');
const connectedSpeechAnalysis = document.getElementById('connected-speech-analysis');
const progressText = document.getElementById('progress-text');
const charCounter = document.getElementById('char-counter');
const thoughtGroupDisplay = document.getElementById('thought-group-display');
const thoughtGroupInfo = document.getElementById('thought-group-info');
const thoughtGroupTooltip = document.getElementById('thought-group-tooltip');
const thoughtGroupAnalysisResult = document.getElementById('thought-group-analysis-result');
const thoughtGroupFeedback = document.getElementById('thought-group-feedback');


// State variables
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let standardIPA = '';
let ipaForText = '';
let audioContext;
let analyser;
let waveformAnimationId;
let lastRecordingBlob = null;
let soundDetected = false;
let ipaLoadingInterval;
let lastTTSAudioNatural = null;
let lastTTSTextNatural = '';
let lastTTSAccentNatural = '';
let lastTTSAudioClear = null;
let lastTTSTextClear = '';
let lastTTSAccentClear = '';
let fetchIpaRequestID = 0;
let progressInterval;
let progressTextInterval;
let currentThoughtGroups = [];

// --- DATA & CONFIG ---
const funFacts = [
    "'Ough' có thể được phát âm theo 10 cách khác nhau.",
    "Âm câm (silent letters) là di tích lịch sử từ các ngôn ngữ khác.",
    "'Pronunciation' (phát âm) trớ trêu lại là từ bị phát âm sai nhiều nhất.",
    "Tiếng Anh có tới 20 âm nguyên âm theo hệ thống IPA, nhiều hơn hầu hết các ngôn ngữ khác.",
    "'Strengths' là từ dài nhất chỉ có một nguyên âm.",
    "'Rhythms' là từ dài nhất không có nguyên âm (a, e, i, o, u).",
    "'Bookkeeper' là từ duy nhất có ba cặp chữ cái lặp lại liên tiếp.",
    "Câu 'Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo.' là một câu đúng ngữ pháp.",
    "Từ 'set' có nhiều định nghĩa nhất trong tiếng Anh, với hơn 430 nghĩa khác nhau.",
    "'Queueing' là từ duy nhất có năm nguyên âm đi liền nhau.",
    "'I am' là câu hoàn chỉnh ngắn nhất trong tiếng Anh.",
    "Câu 'The quick brown fox jumps over the lazy dog' chứa tất cả 26 chữ cái.",
    "Không có từ nào trong tiếng Anh vần với 'month', 'orange', 'silver' hay 'purple'.",
    "'Uncopyrightable' là từ dài nhất không lặp lại bất kỳ chữ cái nào.",
    "Shakespeare đã sáng tạo ra hơn 1,700 từ cho tiếng Anh, ví dụ như 'eyeball', 'swagger', 'bedazzled'."
];

const practiceSentences = [
    "What are you doing?", "It's a piece of cake.", "I'll call you back later.",
    "How's it going?", "Can I have a bottle of water, please?", "It's a beautiful day, isn't it?",
    "I'm looking forward to it.", "Could you please repeat that?", "Where is the nearest station?",
    "Can you help me, please?", "I don't understand.", "Could you repeat that, please?",
    "Could you please talk slower?", "What does this mean?", "How do you spell that?",
    "What do you think?", "That sounds great.", "That's a good idea.", "I have no idea.",
    "I'm not sure.", "Could you give me a hand with this?", "Piece of cake", "Break a leg",
    "Under the weather", "Hit the books", "Call it a day", "What have you been up to?",
    "Is everything okay?", "Take care.", "Let me know if you need anything.", "I'm here for you."
];

const thoughtGroupColors = [
    'bg-blue-500/10 text-blue-300', 
    'bg-green-500/10 text-green-300', 
    'bg-purple-500/10 text-purple-300',
    'bg-yellow-500/10 text-yellow-300'
];


// API Configuration
const apiKey = "AIzaSyBa0ieUPwXxb-W_fFHbB-ldEJG8-sAFxN0"; // API key will be managed by the environment
const TEXT_MODEL = "gemini-2.5-flash-preview-05-20";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;
const TTS_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;


// --- UTILITY FUNCTIONS ---

function showMessage(message, type = 'info') {
    const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-xl text-sm z-50 shadow-lg border fade-in';
    const typeClasses = {
        'info': 'bg-accent-primary/20 text-blue-300 border-accent-primary/30',
        'success': 'bg-accent-success/20 text-green-300 border-accent-success/30',
        'warning': 'bg-accent-warning/20 text-yellow-300 border-accent-warning/30',
        'error': 'bg-accent-danger/20 text-red-300 border-accent-danger/30'
    };
    messageBox.className = `${baseClasses} ${typeClasses[type]}`;
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

function handleApiError(error) {
    console.error("API Error:", error);
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
        showMessage('Hệ thống đang bận. Bạn vui lòng thử lại sau nhé.', 'error');
    } else {
        showMessage(`Đã xảy ra lỗi kết nối: ${error.message}`, 'error');
    }
}

function setButtonLoading(button, isLoading) {
    const textEl = button.querySelector('.text');
    const iconEl = button.querySelector('.icon');
    const spinnerEl = button.querySelector('.btn-spinner');
    button.disabled = isLoading;
    if (isLoading) {
        if(textEl) textEl.style.display = 'none';
        if(iconEl) iconEl.style.display = 'none';
        if(spinnerEl) spinnerEl.classList.remove('hidden');
    } else {
        if(textEl) textEl.style.display = 'inline';
        if(iconEl) iconEl.style.display = 'block';
        if(spinnerEl) spinnerEl.classList.add('hidden');
    }
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcmData, sampleRate) {
    const numChannels = 1, bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

// --- API & CORE LOGIC ---

async function fetchWithBackoff(url, options, maxRetries = 4) {
      let delay = 1000;
      for (let i = 0; i < maxRetries; i++) {
          try {
              const response = await fetch(url, options);
              if (response.status === 429 || response.status >= 500) {
                  if (i === maxRetries - 1) {
                      const errorBody = await response.json().catch(() => ({}));
                      throw new Error(`API Error: ${response.status}. ${errorBody.error?.message || 'Server error after multiple retries.'}`);
                  }
                  await new Promise(resolve => setTimeout(resolve, delay));
                  delay *= 2; 
                  continue; 
              }
              if (!response.ok) {
                   const errorBody = await response.json().catch(() => ({}));
                   throw new Error(`API Error: ${response.status}. ${errorBody.error?.message || 'An unknown error occurred.'}`);
              }
              return await response.json();
          } catch (error) {
              if (i === maxRetries - 1) {
                  throw error;
              }
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
          }
      }
  }

function startIpaLoadingAnimation() {
    clearInterval(ipaLoadingInterval);
    const ipaSymbols = ['ə', 'ʃ', 't', 'd', 'k', 'æ', 'iː', 'θ', 'ð', 'ŋ', 'w', 'j', 'r', 'l', 's', 'z'];
    let i = 0;
    ipaLoadingInterval = setInterval(() => {
        const symbolSequence = Array(5).fill(0).map((_, j) => ipaSymbols[(i + j) % ipaSymbols.length]).join(' ');
        simpleIpaText.textContent = `/ ${symbolSequence} /`;
        detailedIpaText.textContent = `[ ${symbolSequence} ]`;
        thoughtGroupDisplay.textContent = `...`;
        i = (i + 1) % ipaSymbols.length;
    }, 100);
}

function stopIpaLoadingAnimation() {
    clearInterval(ipaLoadingInterval);
}

async function fetchAndDisplayIPA() {
    fetchIpaRequestID++;
    const currentRequestID = fetchIpaRequestID;

    const text = textInput.value.trim();
    if (!text) {
        resetAll();
        return false;
    }
    
    if (ipaForText === text && accentSelect.value === document.body.dataset.accent) {
        controlsSection.classList.remove('hidden');
        thoughtGroupInfo.classList.toggle('hidden', !text.includes(' '));
        return true;
    }

    const accent = accentSelect.value;
    const combinedPrompt = `For the phrase "${text}" in ${accent}, provide a single JSON object with the following keys:
    1.  'simple': A standard, citation-form IPA transcription.
    2.  'detailed': A natural, connected speech transcription. IMPORTANT: This transcription must reflect the thought groups. Show linking (liaison with ‿) **only within** each thought group, not across them. The boundary between groups acts as a hard stop for linking.
    3.  'thought_groups': An object containing two keys:
        a. 'groups': An array of strings, where each string is a natural thought group.
        b. 'explanation': A brief, clear explanation in Vietnamese for why the text is divided that way, based on grammatical boundaries. Start by stating that this is a suggested grouping and other ways are possible depending on emphasis (e.g., "Đây là một cách ngắt nghỉ phổ biến, giúp tách... Tuy nhiên, bạn cũng có thể ngắt khác đi để nhấn mạnh...").
    Respond with ONLY the JSON object.`;
    
    setButtonLoading(transcribeBtn, true);
    controlsSection.classList.remove('hidden');
    thoughtGroupDisplay.classList.toggle('hidden', !text.includes(' '));
    thoughtGroupInfo.classList.toggle('hidden', !text.includes(' '));
    
    startIpaLoadingAnimation();
    
    try {
        const payload = { 
            contents: [{ parts: [{ text: combinedPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await fetchWithBackoff(TEXT_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (currentRequestID !== fetchIpaRequestID) return false;

        const resultText = response.candidates[0].content.parts[0].text;
        const resultJson = JSON.parse(resultText);

        standardIPA = resultJson.detailed;
        ipaForText = text;
        document.body.dataset.accent = accent;
        
        simpleIpaText.textContent = resultJson.simple;
        detailedIpaText.textContent = resultJson.detailed;

        if (resultJson.thought_groups && text.includes(' ')) {
            currentThoughtGroups = resultJson.thought_groups.groups;
            displayThoughtGroups(resultJson.thought_groups.groups, resultJson.thought_groups.explanation);
        } else {
            currentThoughtGroups = [];
            displayThoughtGroups([], '');
        }
        
        return true;
    } catch (error) {
        if (currentRequestID === fetchIpaRequestID) {
            handleApiError(error);
            resetAll();
        }
        return false;
    } finally {
        if (currentRequestID === fetchIpaRequestID) {
            stopIpaLoadingAnimation();
            setButtonLoading(transcribeBtn, false);
        }
    }
}

function displayThoughtGroups(groups, explanation) {
    thoughtGroupDisplay.innerHTML = '';
    thoughtGroupTooltip.textContent = explanation || '';
    thoughtGroupInfo.classList.toggle('hidden', !explanation);

    if (groups && groups.length > 0) {
        groups.forEach((group, index) => {
            const groupSpan = document.createElement('span');
            groupSpan.textContent = group;
            groupSpan.className = `thought-group ${thoughtGroupColors[index % thoughtGroupColors.length]}`;
            thoughtGroupDisplay.appendChild(groupSpan);
        });
    }
}

async function handleListen(type, button) {
    const text = textInput.value.trim();
    const accent = accentSelect.value;
    if (!text) {
        showMessage('Vui lòng nhập từ hoặc câu để nghe.', 'warning');
        return;
    }
    
    const isNatural = type === 'natural';
    
    let cachedAudio, cachedText, cachedAccent;
    if (isNatural) {
        [cachedAudio, cachedText, cachedAccent] = [lastTTSAudioNatural, lastTTSTextNatural, lastTTSAccentNatural];
    } else { // Clear
        [cachedAudio, cachedText, cachedAccent] = [lastTTSAudioClear, lastTTSTextClear, lastTTSAccentClear];
    }

    if (cachedAudio && cachedText === text && cachedAccent === accent) {
        cachedAudio.play();
        return;
    }

    const ipaFetched = await fetchAndDisplayIPA();
    if (!ipaFetched) return;

    setButtonLoading(button, true);
    try {
        let prompt;
        if (isNatural) {
            const textWithPauses = currentThoughtGroups.join(", ");
            prompt = `Read the following text in ${accent}. Pronounce it naturally, with very brief, subtle pauses where the commas appear, ensuring you link all words smoothly within each phrase. The goal is a fluid, connected speech, not a series of disconnected chunks. Text: ${textWithPauses}`;
        } else { // Clear
            prompt = `Say very clearly, with only a slight pause between each word, in ${accent}: ${text}`;
        }

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["AUDIO"] },
            model: TTS_MODEL
        };

        const data = await fetchWithBackoff(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const audioPart = data?.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData) {
            const audioData = audioPart.inlineData.data;
            const mimeType = audioPart.inlineData.mimeType;
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            const audio = new Audio(audioUrl);
            audio.play();

            if(isNatural) {
                [lastTTSAudioNatural, lastTTSTextNatural, lastTTSAccentNatural] = [audio, text, accent];
            } else {
                [lastTTSAudioClear, lastTTSTextClear, lastTTSAccentClear] = [audio, text, accent];
            }
        } else {
            throw new Error("Không nhận được dữ liệu âm thanh hợp lệ.");
        }
    } catch (error) {
        handleApiError(error);
    } finally {
        setButtonLoading(button, false);
    }
}

function startProgressSimulation() {
    const progressBarInner = document.querySelector('.progress-bar-inner');
    if (!progressBarInner) return;
    
    let width = 0;
    progressBarInner.style.width = '0%';
    
    clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        if (width < 95) {
            width += Math.random() * 2;
        } else {
            clearInterval(progressInterval);
        }
        progressBarInner.style.width = Math.min(width, 95) + '%';
    }, 100);
}

function stopProgressSimulation() {
    clearInterval(progressInterval);
    const progressBarInner = document.querySelector('.progress-bar-inner');
    if (progressBarInner) {
        progressBarInner.style.width = '100%';
    }
}

function startProgressTextAnimation() {
    const steps = [
        "Đang gửi bản ghi âm của bạn...",
        "AI đang phiên âm giọng nói...",
        "Đối chiếu với phiên âm chuẩn...",
        "Phân tích ngữ điệu và cụm tư duy...",
        "Sắp xong rồi! Đang tổng hợp kết quả..."
    ];
    let currentStep = 0;
    progressText.textContent = steps[currentStep];
    
    clearInterval(progressTextInterval);
    progressTextInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;
        progressText.textContent = steps[currentStep];
    }, 2000);
}

function stopProgressTextAnimation() {
    clearInterval(progressTextInterval);
}


async function analyzeAudio() {
    if (audioChunks.length === 0) return;
    lastRecordingBlob = new Blob(audioChunks, { type: 'audio/webm' });
    listenAgainBtn.disabled = false;

    let ipaReady = (ipaForText === textInput.value.trim() && accentSelect.value === document.body.dataset.accent);
    if (!ipaReady) {
        ipaReady = await fetchAndDisplayIPA();
    }
    if (!ipaReady) {
        showMessage('Không thể phân tích vì không lấy được phiên âm chuẩn.', 'error');
        return;
    }
    
    loader.classList.remove('hidden');
    startProgressTextAnimation();
    startProgressSimulation();
    funFactEl.textContent = `💡 ${funFacts[Math.floor(Math.random() * funFacts.length)]}`;
    funFactEl.classList.remove('hidden');
    
    const reader = new FileReader();
    reader.readAsDataURL(lastRecordingBlob);
    reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const isSentence = textInput.value.trim().includes(' ');
        
        const prompt = {
            "role": "You are PrAI, a world-class phonetician...",
            "context": {
                "text_to_pronounce": textInput.value.trim(),
                "target_accent": accentSelect.value === 'American English' ? 'AmE' : 'BrE',
                "standard_ipa": standardIPA,
                "ideal_thought_groups": currentThoughtGroups.join(' / '),
                "is_sentence": isSentence,
                "phonetic_guidelines": {
                    "instruction": "Your feedback must be gentle, encouraging, detailed, positive, and constructive. It must be scientifically rigorous and natural-sounding. **Crucially, you must always address the user as 'bạn' and never as 'con'.**",
                    "vietnamese_learner_focus": [
                        "Pay special attention to common Vietnamese L1 interference patterns: final consonant deletion, incorrect vowel length, difficulty with consonant clusters, and a syllable-timed rhythm.",
                        "Analyze connected speech phenomena (assimilation, elision, linking) *within* thought groups.",
                        "Crucially, a pause *between* thought groups breaks the phonetic link. Your analysis must reflect this."
                    ]
                }
            },
            "task": `First, determine if the audio contains discernible English speech. If not, set 'speech_detected' to false and return. If speech is detected, perform a scientifically rigorous analysis.
            1.  **Phoneme Analysis (Strict):** You MUST analyze every single phoneme from the 'standard_ipa'. The 'phoneme_analysis' array MUST contain an object for each phoneme, in the exact same order.
            2.  **Scoring:** Provide an 'overall_score' (0-100).
            3.  **Thought Group Analysis (if sentence):** Analyze the user's pausing and rhythm.
            4.  **Other Analysis & Feedback:** Analyze stress, and, if it's a sentence, intonation and connected speech.
            5.  **Mandatory Detailed Feedback:** For sentences, **always** provide feedback for 'advanced_analysis'.
            Return the result in the specified JSON format.`,
            "output_format_instruction": {
                "format": "JSON",
                "schema": {
                    "speech_detected": "boolean",
                    "overall_score": "number | null",
                    "user_ipa": "string | null",
                    "phoneme_analysis": "[ { \"phoneme\": \"string\", \"status\": \"string ('correct', 'approximate', 'incorrect')\", \"feedback\": \"string | null\" } ] | null",
                    "stress_analysis": "{ \"correctly_placed\": \"boolean\", \"feedback\": \"string\" } | null",
                    "thought_group_analysis?": "{ \"feedback\": \"string\" } | null",
                    "advanced_analysis?": "{ \"intonation\": { \"feedback\": \"string\" }, \"connected_speech\": [ { \"type\": \"string\", \"rule\": \"string\", \"example\": \"string\", \"explanation\": \"string\", \"feedback\": \"string\" } ] } | null",
                    "practice_suggestions": "{ \"youglish_us\": \"string\", \"youglish_uk\": \"string\" } | null"
                }
            }
        };

        const payload = {
            contents: [ { role: "user", parts: [ { text: JSON.stringify(prompt) }, { inlineData: { mimeType: "audio/webm", data: base64Audio } } ] } ],
            generationConfig: { responseMimeType: "application/json" }
        };

        try {
            const data = await fetchWithBackoff(TEXT_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const resultText = data.candidates[0].content.parts[0].text;
            const resultJson = JSON.parse(resultText);
            displayResults(resultJson);
        } catch (error) {
            handleApiError(error);
        } finally {
            stopProgressSimulation();
            stopProgressTextAnimation();
            setTimeout(() => {
                loader.classList.add('hidden');
                funFactEl.classList.add('hidden');
            }, 500);
        }
    };
}

function displayResults(data) {
    if (!data.speech_detected || data.overall_score === null) {
        showMessage("PrAI không nhận diện được giọng nói trong bản ghi âm. Vui lòng thử lại và nói to, rõ hơn nhé.", 'warning');
        analysisResults.classList.add('hidden');
        return;
    }

    analysisResults.classList.remove('hidden');
    overallScore.textContent = `${data.overall_score}`;
    overallScore.className = `${data.overall_score > 85 ? 'text-green-400' : data.overall_score > 70 ? 'text-yellow-400' : 'text-red-400'}`;
    
    phonemeAnalysis.innerHTML = '';
    if (data.phoneme_analysis) {
        data.phoneme_analysis.forEach(p => {
            const phonemeEl = document.createElement('div');
            phonemeEl.textContent = p.phoneme;
            phonemeEl.className = 'phoneme has-tooltip';
            
            if (p.status === 'correct') { 
                phonemeEl.classList.add('status-correct');
            } else if (p.status === 'approximate') { 
                phonemeEl.classList.add('status-approximate');
            } else { 
                phonemeEl.classList.add('status-incorrect');
            }

            if (p.feedback) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip absolute bottom-full left-1/2 mb-2 w-64 rounded-lg p-3 text-xs shadow-lg';
                tooltip.textContent = p.feedback;
                phonemeEl.appendChild(tooltip);
            }
            phonemeAnalysis.appendChild(phonemeEl);
        });
    }

    if (data.stress_analysis) {
        stressAnalysis.innerHTML = data.stress_analysis.feedback;
        stressAnalysis.classList.toggle('text-green-400', data.stress_analysis.correctly_placed);
        stressAnalysis.classList.toggle('text-red-400', !data.stress_analysis.correctly_placed);
    }
    
    if (data.thought_group_analysis && data.thought_group_analysis.feedback) {
        thoughtGroupFeedback.innerHTML = data.thought_group_analysis.feedback;
        thoughtGroupAnalysisResult.classList.remove('hidden');
    } else {
        thoughtGroupAnalysisResult.classList.add('hidden');
    }


    if (data.advanced_analysis) {
        intonationAnalysis.innerHTML = data.advanced_analysis.intonation.feedback;
        connectedSpeechAnalysis.innerHTML = '';
        if (data.advanced_analysis.connected_speech && data.advanced_analysis.connected_speech.length > 0) {
            data.advanced_analysis.connected_speech.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'space-y-1';
                itemEl.innerHTML = `
                    <h5 class="font-semibold text-accent-primary">${item.type}</h5>
                    <p class="text-sm"><strong class="font-medium text-text-secondary">Quy tắc:</strong> ${item.rule}</p>
                    <p class="text-sm"><strong class="font-medium text-text-secondary">Ví dụ:</strong> <span class="ipa-text text-accent-warning">${item.example}</span></p>
                    <p class="text-sm"><strong class="font-medium text-text-secondary">Nhận xét:</strong> ${item.feedback}</p>
                `;
                connectedSpeechAnalysis.appendChild(itemEl);
            });
        } else {
            connectedSpeechAnalysis.innerHTML = '<p class="text-text-secondary">Không phát hiện hiện tượng nối âm nổi bật trong câu này.</p>';
        }
        showMoreBtn.classList.remove('hidden');
    } else {
        showMoreBtn.classList.add('hidden');
    }

    if (data.practice_suggestions) {
        suggestionLinks.innerHTML = '';
        const { youglish_us, youglish_uk } = data.practice_suggestions;
        
        const usLink = document.createElement('a');
        usLink.href = youglish_us;
        usLink.target = '_blank';
        usLink.className = 'btn btn-primary flex-1';
        usLink.textContent = 'Giọng Mỹ (YouGlish)';
        
        const ukLink = document.createElement('a');
        ukLink.href = youglish_uk;
        ukLink.target = '_blank';
        ukLink.className = 'btn btn-primary flex-1';
        ukLink.textContent = 'Giọng Anh (YouGlish)';

        suggestionLinks.appendChild(usLink);
        suggestionLinks.appendChild(ukLink);
        practiceSuggestions.classList.remove('hidden');
    } else {
        practiceSuggestions.classList.add('hidden');
    }
}

// --- UI & EVENT HANDLERS ---

function resetAnalysisOnly() {
    analysisResults.classList.add('hidden');
    practiceSuggestions.classList.add('hidden');
    showMoreBtn.classList.add('hidden');
    advancedAnalysis.classList.add('hidden');
    thoughtGroupAnalysisResult.classList.add('hidden');
    showMoreBtn.textContent = 'Thông tin thêm';
}

function resetAll() {
    standardIPA = '';
    ipaForText = '';
    controlsSection.classList.add('hidden');
    resetAnalysisOnly();
    lastTTSAudioNatural = null;
    lastTTSTextNatural = '';
    lastTTSAccentNatural = '';
    lastTTSAudioClear = null;
    lastTTSTextClear = '';
    lastTTSAccentClear = '';
    currentThoughtGroups = [];
    displayThoughtGroups([], '');
}

async function handleRecord() {
    if (isRecording) {
        mediaRecorder.stop();
        return;
    }
    
    if (!textInput.value.trim()) {
        showMessage('Vui lòng nhập từ để ghi âm và phân tích.', 'warning');
        return;
    }
    
    resetAnalysisOnly();
    listenAgainBtn.disabled = true;
    lastRecordingBlob = null;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isRecording = true;
        soundDetected = false;
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            isRecording = false;
            stopWaveform();
            stream.getTracks().forEach(track => track.stop());
            recordBtn.querySelector('.text').textContent = 'Ghi âm';
            recordBtn.classList.remove('is-recording');
            if (soundDetected) {
                analyzeAudio();
            } else {
                showMessage("PrAI không phát hiện thấy âm thanh. Vui lòng thử ghi âm lại nhé.", "error");
            }
        };
        mediaRecorder.start();
        startWaveform(stream);
        recordBtn.querySelector('.text').textContent = 'Dừng';
        recordBtn.classList.add('is-recording');
    } catch (error) {
        console.error("Error accessing microphone:", error);
        showMessage('Không thể truy cập micro. Vui lòng cấp quyền và thử lại.', 'error');
    }
}

function handleListenAgain() {
    if (lastRecordingBlob) {
        const audioUrl = URL.createObjectURL(lastRecordingBlob);
        replayAudio.src = audioUrl;
        replayAudio.play();
    }
}

function startWaveform(stream) {
    recordBtn.style.display = 'none';
    listenAgainBtn.style.display = 'none';
    waveformContainer.classList.remove('hidden');
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = waveformEl;
    const canvasCtx = canvas.getContext('2d');

    function draw() {
        waveformAnimationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        const averageVolume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        if (averageVolume > 15) {
            soundDetected = true;
        }
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2.5;
            const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
            gradient.addColorStop(0, 'var(--accent-primary)');
            gradient.addColorStop(1, 'var(--accent-success)');
            canvasCtx.fillStyle = gradient;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    draw();
}

function stopWaveform() {
    if (waveformAnimationId) cancelAnimationFrame(waveformAnimationId);
    if (audioContext && audioContext.state !== 'closed') audioContext.close();
    recordBtn.style.display = 'flex';
    listenAgainBtn.style.display = 'inline-flex';
    waveformContainer.classList.add('hidden');
}

function toggleAdvancedAnalysis() {
    const isHidden = advancedAnalysis.classList.contains('hidden');
    advancedAnalysis.classList.toggle('hidden');
    showMoreBtn.textContent = isHidden ? 'Ẩn bớt' : 'Thông tin thêm';
}

function handleRandomPractice() {
    const randomSentence = practiceSentences[Math.floor(Math.random() * practiceSentences.length)];
    textInput.value = randomSentence;
    charCounter.textContent = `${randomSentence.length} / 250`;
    resetAll();
    fetchAndDisplayIPA();
}


// Initial setup
function init() {
    accentSelect.value = 'British English';

    textInput.addEventListener('input', () => {
        const currentLength = textInput.value.length;
        const maxLength = textInput.getAttribute('maxlength');
        charCounter.textContent = `${currentLength} / ${maxLength}`;
        resetAll();
    });
    accentSelect.addEventListener('change', () => {
        if (textInput.value.trim()) {
            resetAll();
            fetchAndDisplayIPA();
        }
    });
    transcribeBtn.addEventListener('click', fetchAndDisplayIPA);
    listenNaturalBtn.addEventListener('click', (e) => handleListen('natural', e.currentTarget));
    listenClearBtn.addEventListener('click', (e) => handleListen('clear', e.currentTarget));
    recordBtn.addEventListener('click', handleRecord);
    listenAgainBtn.addEventListener('click', handleListenAgain);
    showMoreBtn.addEventListener('click', toggleAdvancedAnalysis);
    randomPracticeBtn.addEventListener('click', handleRandomPractice);
    textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            fetchAndDisplayIPA();
        }
    });
}

init();
