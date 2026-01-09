
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createPcmBlob, decodeAudio, convertAudioDataToBuffer } from '../services/audioUtils';
import { useNotify } from '../context/NotificationContext';
import { agencyFunctions } from '../services/geminiService';

export const useLiveAssistant = (
  onActionDetected?: (action: any) => void,
  onTranscriptionUpdate?: (text: string, isUser: boolean) => void
) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const { notify } = useNotify();
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const stopSession = useCallback(() => {
    setIsVoiceMode(false);
    setIsLiveActive(false);
    
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    sessionPromiseRef.current = null;
  }, []);

  const startSession = useCallback(async (systemInstruction: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let inputCtx: AudioContext | null = null;
    let outputCtx: AudioContext | null = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      setIsLiveActive(true);
      setIsVoiceMode(true);

      const sessionPromise = ai.live.connect({
        // Update Live API model to the latest recommended version
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
          },
          systemInstruction,
          tools: [{ functionDeclarations: agencyFunctions }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            if (!inputCtx) return;
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription && onTranscriptionUpdate) {
              onTranscriptionUpdate(msg.serverContent.inputTranscription.text, true);
            }
            if (msg.serverContent?.outputTranscription && onTranscriptionUpdate) {
              onTranscriptionUpdate(msg.serverContent.outputTranscription.text, false);
            }

            if (msg.toolCall) {
              msg.toolCall.functionCalls.forEach(fc => {
                if (onActionDetected) onActionDetected(fc);
                sessionPromise.then(s => {
                  s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                  });
                });
              });
            }

            const base64EncodedAudioString = msg.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64EncodedAudioString && outputCtx) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await convertAudioDataToBuffer(
                decodeAudio(base64EncodedAudioString),
                outputCtx,
                24000,
                1
              );
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => activeSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error("Live Assistant Error:", e);
            stopSession();
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e: any) {
      notify(e.message || 'خطأ في تشغيل الخبير الصوتي', 'error');
      stopSession();
    }
  }, [stopSession, notify, onActionDetected, onTranscriptionUpdate]);

  return { isVoiceMode, isLiveActive, startSession, stopSession };
};
