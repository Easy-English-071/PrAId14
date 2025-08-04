// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, doc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const recordingText = document.getElementById('recording-text');
const replayAudio = document.getElementById('replay-audio');
const funFactEl = document.getElementById('fun-fact');
const showMoreBtn = document.getElementById('show-more-btn');
const advancedAnalysis = document.getElementById('advanced-analysis');
const intonationAnalysis = document.getElementById('intonation-analysis');
const connectedSpeechAnalysis = document.getElementById('connected-speech-analysis');
const themeToggle = document.getElementById('theme-toggle');
const themeIconLight = document.getElementById('theme-icon-light');
const themeIconDark = document.getElementById('theme-icon-dark');
const progressText = document.getElementById('progress-text');
const charCounter = document.getElementById('char-counter');
const historyToggle = document.getElementById('history-toggle');
const historyPanel = document.getElementById('history-panel');
const closeHistoryPanel = document.getElementById('close-history-panel');
const historyList = document.getElementById('history-list');
const noHistoryMessage = document.getElementById('no-history-message');
const panelOverlay = document.getElementById('panel-overlay');
const historyAudio = document.getElementById('history-audio');

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

// Firebase State
let db, auth, userId;
let historyUnsubscribe = null;

// --- DATA & CONFIG ---
const funFacts = [
    "'Ough' có thể được phát âm theo 10 cách khác nhau.",
    "Âm câm (silent letters) là di tích lịch sử từ các ngôn ngữ khác.",
    "'Pronunciation' (phát âm) trớ trêu lại là từ bị phát âm sai nhiều nhất.",
    "Tiếng Anh có tới 20 âm nguyên âm theo hệ thống IPA, nhiều hơn hầu hết các ngôn ngữ khác.",
    "'Strengths' là từ dài nhất chỉ có một nguyên âm.",
    "'Rhythms' là từ dài nhất không có nguyên âm (a, e, i, o, u).",
    "'Bookkeeper' là từ duy nhất có ba cặp chữ cái lặp lại liên tiếp.",
    "Crutch Words (Từ đệm): Những từ như 'like', 'actually', 'basically', 'literally' thường được dùng làm từ đệm trong giao tiếp hàng ngày mà không thêm nhiều ý nghĩa.",
    "Câu 'Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo.' là một câu đúng ngữ pháp, sử dụng ba nghĩa của từ 'buffalo' (trâu, thành phố Buffalo, và động từ 'doạ nạt').",
    "Âm 'gh' khó đoán: 'gh' có thể được phát âm là /f/ như trong 'enough', /g/ như trong 'ghost', hoặc câm như trong 'though'.",
    "Từ 'set' giữ kỷ lục: Từ 'set' có nhiều định nghĩa nhất trong tiếng Anh, với hơn 430 nghĩa khác nhau trong Từ điển Oxford.",
    "'Queueing' là từ duy nhất có năm nguyên âm đi liền nhau.",
    "'I am' là câu hoàn chỉnh ngắn nhất trong tiếng Anh.",
    "Câu 'The quick brown fox jumps over the lazy dog' chứa tất cả 26 chữ cái trong bảng chữ cái.",
    "Không có từ nào trong tiếng Anh vần với 'month', 'orange', 'silver' hay 'purple'.",
    "'Uncopyrightable' là từ dài nhất không lặp lại bất kỳ chữ cái nào.",
    "Từ dài nhất trong từ điển là 'pneumonoultramicroscopicsilicovolcanoconiosis' (một loại bệnh phổi).",
    "Shakespeare đã sáng tạo ra hơn 1,700 từ cho tiếng Anh, ví dụ như 'eyeball', 'swagger', 'bedazzled'.",
    "Từ 'lol' (laughing out loud) đã được thêm vào từ điển Oxford vào năm 2011.",
    "'SWIMS' khi lộn ngược lại vẫn là 'SWIMS'.",
    "'Stewardesses' là từ dài nhất có thể gõ chỉ bằng tay trái trên bàn phím QWERTY.",
    "Từ 'dreamt' là từ duy nhất kết thúc bằng '-mt'.",
    "Chữ cái được sử dụng nhiều nhất là 'e', và chữ cái bắt đầu nhiều từ nhất là 's'."
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
    "Is everything okay?", "Take care.", "Let me know if you need anything.", "I'm here for you.",
    "Can I have your attention, please?", "Let's get down to business.", "How much is this?",
    "Do you have this in a different size?", "I'm just browsing, thanks.", "I'll take it.",
    "Keep the change.", "Could I have the bill, please?", "It's on me.", "Let's split the bill."
];

// API Configuration
const apiKey = ""; // API key is provided by the environment
const TEXT_MODEL = "gemini-2.5-flash-preview-05-20";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;
const TTS_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;


// --- UTILITY FUNCTIONS ---

function showMessage(message, type = 'info') {
    const colors = {
        'info': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/80 dark:text-blue-300 dark:border-blue-500/30',
        'success': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/80 dark:text-green-300 dark:border-green-500/30',
        'warning': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/80 dark:text-yellow-300 dark:border-yellow-500/30',
        'error': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/80 dark:text-red-300 dark:border-red-500/30'
    };
    messageBox.className = `fixed bottom-5 right-5 p-4 rounded-xl text-sm z-50 shadow-lg border ${colors[type]} fade-in`;
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
    const textEl = button.querySelector('.text') || button.querySelector('span');
    const iconEl = button.querySelector('.icon');
    const spinnerEl = button.querySelector('.btn-spinner');
    button.disabled = isLoading;
    if (isLoading) {
        if(textEl) textEl.classList.add('hidden');
        if(iconEl) iconEl.classList.add('hidden');
        if(spinnerEl) spinnerEl.classList.remove('hidden');
    } else {
        if(textEl) textEl.classList.remove('hidden');
        if(iconEl) iconEl.classList.remove('hidden');
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
     let delay = 1000; // start with 1 second
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
        return true;
    }

    const accent = accentSelect.value;
    const combinedPrompt = `For the phrase "${text}" in ${accent}, provide two IPA transcriptions in a single JSON object.
    1.  'simple': A standard transcription with each word transcribed individually.
    2.  'detailed': A natural, connected speech transcription, including features like linking (liaison with the tie bar symbol ‿), elision, assimilation, and intrusion where phonologically appropriate.
    Respond with ONLY the JSON object. Example for "an apple": {"simple": "/ən ˈæpəl/", "detailed": "/ən‿ˈæpəl/"}`;
    
    setButtonLoading(transcribeBtn, true);
    controlsSection.classList.remove('hidden');
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

async function handleListen(type, button) {
    const text = textInput.value.trim();
    const accent = accentSelect.value;
    if (!text) {
        showMessage('Vui lòng nhập từ hoặc câu để nghe.', 'warning');
        return;
    }
    
    const isNatural = type === 'natural';
    const cachedAudio = isNatural ? lastTTSAudioNatural : lastTTSAudioClear;
    const cachedText = isNatural ? lastTTSTextNatural : lastTTSTextClear;
    const cachedAccent = isNatural ? lastTTSAccentNatural : lastTTSAccentClear;

    if (cachedAudio && cachedText === text && cachedAccent === accent) {
        cachedAudio.play();
        return;
    }

    const ipaFetched = await fetchAndDisplayIPA();
    if (!ipaFetched) return;

    setButtonLoading(button, true);
    try {
        const prompt = isNatural 
            ? `In ${accent}, pronounce the phrase "${text}" to sound exactly like this phonetic transcription: ${detailedIpaText.textContent}. Only generate the audio of the spoken phrase.`
            : `Say very clearly, with only a slight pause between each word, in ${accent}: ${text}`;

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
                lastTTSAudioNatural = audio;
                lastTTSTextNatural = text;
                lastTTSAccentNatural = accent;
            } else {
                lastTTSAudioClear = audio;
                lastTTSTextClear = text;
                lastTTSAccentClear = accent;
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
        "Phân tích ngữ điệu và nối âm...",
        "Sắp xong rồi! Đang tổng hợp kết quả..."
    ];
    let currentStep = 0;
    progressText.textContent = steps[currentStep];
    
    clearInterval(progressTextInterval);
    progressTextInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;
        progressText.textContent = steps[currentStep];
    }, 2000); // Change text every 2 seconds
}

function stopProgressTextAnimation() {
    clearInterval(progressTextInterval);
}


async function analyzeAudio() {
    if (audioChunks.length === 0) return;
    lastRecordingBlob = new Blob(audioChunks, { type: 'audio/webm' });
    listenAgainBtn.disabled = false;
    listenAgainBtn.classList.remove('bg-gray-300', 'text-gray-500', 'dark:bg-gray-600', 'dark:text-gray-400');
    listenAgainBtn.classList.add('btn-replay');

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
            "role": "You are PrAI, a world-class phonetician. Your expertise is informed by the key findings in the document 'Phân Tích Ngữ Âm Học Toàn Diện về Các Lỗi Phát Âm Tiếng Anh Thường Gặp của Người Việt'.",
            "context": {
                "text_to_pronounce": textInput.value.trim(),
                "target_accent": accentSelect.value === 'American English' ? 'AmE' : 'BrE',
                "standard_ipa": standardIPA,
                "is_sentence": isSentence,
                "phonetic_guidelines": {
                    "instruction": "Your feedback must be gentle, encouraging, detailed, positive, and constructive. It must be scientifically rigorous and natural-sounding. **Crucially, you must always address the user as 'bạn' and never as 'con'.**",
                    "vietnamese_learner_focus": [
                        "Pay special attention to common Vietnamese L1 interference patterns as described in your knowledge base: final consonant deletion (e.g., 'nice' -> /naɪ/), incorrect vowel length (e.g., /i:/ vs /ɪ/), difficulty with consonant clusters, and a syllable-timed rhythm instead of a stress-timed one.",
                        "Analyze connected speech phenomena (assimilation, elision, linking)."
                    ]
                }
            },
            "task": `First, determine if the audio contains discernible English speech. If not, set 'speech_detected' to false and return immediately. If speech is detected, perform a scientifically rigorous analysis based on your knowledge of Vietnamese speakers' common errors.
            1.  **Phoneme Analysis (Strict):** You MUST analyze every single phoneme from the 'standard_ipa' provided in the context. The returned 'phoneme_analysis' array must contain an object for each phoneme, in the exact same order as they appear in the 'standard_ipa' string. Do not skip any phonemes.
            2.  **Scoring:** Provide an 'overall_score' (0-100) based on the complete analysis.
            3.  **Other Analysis & Feedback:** Analyze stress, and, if it's a sentence, intonation and connected speech. Adopt a gentle and encouraging tone. Prioritize feedback based on impact on intelligibility.
            4.  **Mandatory Detailed Feedback:** For sentences, **always** provide feedback for 'advanced_analysis' (intonation and connected speech). Even if the user's pronunciation is good, provide positive reinforcement and explain what they did correctly (e.g., "Bạn đã nối âm rất tốt ở '...'). If no connected speech phenomena were expected or produced, state that clearly.
            Return the result in the specified JSON format.`,
            "output_format_instruction": {
                "format": "JSON",
                "schema": {
                    "speech_detected": "boolean",
                    "overall_score": "number | null",
                    "user_ipa": "string | null",
                    "phoneme_analysis": "[ { \"phoneme\": \"string\", \"status\": \"string ('correct', 'approximate', 'incorrect')\", \"feedback\": \"string | null\" } ] | null",
                    "stress_analysis": "{ \"correctly_placed\": \"boolean\", \"feedback\": \"string\" } | null",
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
            // Save to history after displaying results
            if (resultJson.speech_detected) {
                saveToHistory(resultJson, base64Audio);
            }
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
    overallScore.textContent = `${data.overall_score}/100`;
    overallScore.className = `font-bold ${data.overall_score > 85 ? 'text-green-500' : data.overall_score > 70 ? 'text-yellow-500' : 'text-red-500'}`;
    
    phonemeAnalysis.innerHTML = '';
    if (data.phoneme_analysis) {
        data.phoneme_analysis.forEach(p => {
            const phonemeEl = document.createElement('div');
            phonemeEl.textContent = p.phoneme;
            phonemeEl.className = 'phoneme p-2 rounded-md text-lg relative shadow-sm';
            
            if (p.status === 'correct') { 
                phonemeEl.classList.add('bg-green-100', 'dark:bg-green-500/20', 'text-green-700', 'dark:text-green-300');
            } else if (p.status === 'approximate') { 
                phonemeEl.classList.add('bg-yellow-100', 'dark:bg-yellow-500/20', 'text-yellow-700', 'dark:text-yellow-300', 'has-tooltip');
            } else { 
                phonemeEl.classList.add('bg-red-100', 'dark:bg-red-500/20', 'text-red-700', 'dark:text-red-300', 'has-tooltip');
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
        stressAnalysis.textContent = data.stress_analysis.feedback;
        stressAnalysis.className = `p-3 bg-input-bg rounded-lg ${data.stress_analysis.correctly_placed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`;
    }

    if (data.advanced_analysis) {
        intonationAnalysis.textContent = data.advanced_analysis.intonation.feedback;
        connectedSpeechAnalysis.innerHTML = '';
        if (data.advanced_analysis.connected_speech && data.advanced_analysis.connected_speech.length > 0) {
            data.advanced_analysis.connected_speech.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'space-y-2';
                itemEl.innerHTML = `
                    <h5 class="font-semibold text-indigo-600 dark:text-indigo-400">${item.type}</h5>
                    <p class="text-sm text-secondary"><strong class="font-medium text-primary">Quy tắc:</strong> ${item.rule}</p>
                    <p class="text-sm text-secondary"><strong class="font-medium text-primary">Ví dụ:</strong> <span class="ipa-text text-cyan-600 dark:text-cyan-300">${item.example}</span></p>
                    <p class="text-sm text-secondary"><strong class="font-medium text-primary">Giải thích:</strong> ${item.explanation}</p>
                    <p class="text-sm p-2 rounded-md ${item.feedback.toLowerCase().includes('tốt') ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'}"><strong class="font-medium text-primary">Nhận xét:</strong> ${item.feedback}</p>
                `;
                connectedSpeechAnalysis.appendChild(itemEl);
            });
        } else {
            connectedSpeechAnalysis.innerHTML = '<p class="text-secondary">Không phát hiện hiện tượng nối âm nổi bật trong câu này.</p>';
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
        usLink.className = 'btn btn-danger flex-1 text-center font-semibold py-2 px-4 rounded-lg';
        usLink.textContent = 'Giọng Mỹ (YouGlish)';
        
        const ukLink = document.createElement('a');
        ukLink.href = youglish_uk;
        ukLink.target = '_blank';
        ukLink.className = 'btn btn-primary flex-1 text-center font-semibold py-2 px-4 rounded-lg';
        ukLink.textContent = 'Giọng Anh (YouGlish)';

        suggestionLinks.appendChild(usLink);
        suggestionLinks.appendChild(ukLink);
        practiceSuggestions.classList.remove('hidden');
    } else {
        practiceSuggestions.classList.add('hidden');
    }
}

// --- HISTORY FUNCTIONS (NEW) ---

async function saveToHistory(analysisData, audioBase64) {
    if (!userId) {
        console.error("User not authenticated. Cannot save history.");
        return;
    }

    // Firestore document size limit is 1 MiB. Base64 is ~33% larger than binary.
    // We'll set a limit of 700KB for the base64 string to be safe.
    if (audioBase64.length > 700 * 1024) {
        showMessage("Bản ghi âm quá dài để lưu vào lịch sử.", "warning");
        return;
    }
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'practiceHistory');

    try {
        await addDoc(historyRef, {
            text: textInput.value.trim(),
            score: analysisData.overall_score,
            accent: accentSelect.value,
            createdAt: new Date().toISOString(),
            audioBase64: audioBase64
        });
        showMessage("Đã lưu vào lịch sử luyện tập.", "success");
    } catch (error) {
        console.error("Error saving to Firestore: ", error);
        showMessage("Không thể lưu vào lịch sử.", "error");
    }
}

function loadHistory() {
    if (!userId) return;
    if (historyUnsubscribe) historyUnsubscribe(); // Unsubscribe from previous listener

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'practiceHistory');
    const q = query(historyRef, orderBy("createdAt", "desc"));

    historyUnsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            historyList.innerHTML = ''; // Clear previous items
            noHistoryMessage.classList.remove('hidden');
            return;
        }
        
        noHistoryMessage.classList.add('hidden');
        historyList.innerHTML = ''; // Clear and re-render
        querySnapshot.forEach((doc) => {
            renderHistoryItem(doc.data());
        });
    }, (error) => {
        console.error("Error loading history:", error);
        showMessage("Không thể tải lịch sử luyện tập.", "error");
    });
}

function renderHistoryItem(data) {
    const itemEl = document.createElement('div');
    itemEl.className = 'p-4 rounded-lg glass-effect bg-white/50 dark:bg-slate-800/50 flex items-center justify-between gap-3 fade-in';

    const scoreColor = data.score > 85 ? 'text-green-500' : data.score > 70 ? 'text-yellow-500' : 'text-red-500';
    const date = new Date(data.createdAt).toLocaleString('vi-VN');

    itemEl.innerHTML = `
        <div class="flex-grow overflow-hidden">
            <p class="font-semibold text-primary truncate" title="${data.text}">"${data.text}"</p>
            <p class="text-sm text-secondary">Điểm: <span class="font-bold ${scoreColor}">${data.score}/100</span> - ${date}</p>
        </div>
        <button class="play-history-btn btn btn-primary p-2 rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
    `;

    itemEl.querySelector('.play-history-btn').addEventListener('click', () => {
        try {
            const byteCharacters = atob(data.audioBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], {type: 'audio/webm'});
            const audioUrl = URL.createObjectURL(audioBlob);
            historyAudio.src = audioUrl;
            historyAudio.play();
        } catch (e) {
            console.error("Error playing history audio:", e);
            showMessage("Không thể phát lại bản ghi âm này.", "error");
        }
    });

    historyList.appendChild(itemEl);
}

// --- UI & EVENT HANDLERS ---

function resetAnalysisOnly() {
    analysisResults.classList.add('hidden');
    practiceSuggestions.classList.add('hidden');
    showMoreBtn.classList.add('hidden');
    advancedAnalysis.classList.add('hidden');
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
    listenAgainBtn.classList.remove('btn-replay');
    listenAgainBtn.classList.add('bg-gray-300', 'text-gray-500', 'dark:bg-gray-600', 'dark:text-gray-400');
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
            recordBtn.classList.remove('btn-warning');
            recordBtn.classList.add('btn-danger');
            if (soundDetected) {
                analyzeAudio();
            } else {
                showMessage("PrAI không phát hiện thấy âm thanh. Vui lòng thử ghi âm lại nhé.", "error");
            }
        };
        mediaRecorder.start();
        startWaveform(stream);
        recordBtn.querySelector('.text').textContent = 'Dừng';
        recordBtn.classList.remove('btn-danger');
        recordBtn.classList.add('btn-warning');
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
    waveformContainer.classList.remove('hidden');
    recordingText.classList.remove('hidden');
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
        const volumeThreshold = 15;
        if (averageVolume > volumeThreshold) {
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
            gradient.addColorStop(0, '#22d3ee');
            gradient.addColorStop(1, '#14b8a6');
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
    waveformContainer.classList.add('hidden');
    recordingText.classList.add('hidden');
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

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIconLight.classList.add('hidden');
        themeIconDark.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        themeIconLight.classList.remove('hidden');
        themeIconDark.classList.add('hidden');
    }
}

function toggleHistoryPanel(show) {
    if (show) {
        panelOverlay.classList.remove('hidden');
        historyPanel.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
    } else {
        panelOverlay.classList.add('hidden');
        historyPanel.classList.add('translate-x-full');
        document.body.style.overflow = '';
    }
}

// Initial setup
async function init() {
    // Theme setup
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme') || 'light';
    } catch (e) {
        console.warn("Could not access localStorage. Defaulting to light theme.");
    }
    applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem('theme', newTheme);
        } catch(e) {
            console.warn("Could not save theme to localStorage.");
        }
        applyTheme(newTheme);
    });

    accentSelect.value = 'British English';

    // Firebase setup
    try {
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                loadHistory();
            }
        });

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

    } catch (error) {
        console.error("Firebase initialization failed:", error);
        showMessage("Không thể kết nối đến dịch vụ lưu trữ lịch sử.", "error");
    }


    // Event Listeners
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

    // History panel listeners
    historyToggle.addEventListener('click', () => toggleHistoryPanel(true));
    closeHistoryPanel.addEventListener('click', () => toggleHistoryPanel(false));
    panelOverlay.addEventListener('click', () => toggleHistoryPanel(false));
}

init();
