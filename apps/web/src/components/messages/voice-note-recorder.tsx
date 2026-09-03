'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, StopCircle, Trash2, Send, AlertCircle, Play, Pause } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioBlob: Blob, durationSec: number, audioUrl: string) => void;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({
  onSendVoiceNote,
  onCancel,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 20, 30, 45, 20, 15, 35, 50, 25, 40]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start recording on mount
  useEffect(() => {
    let isCancelled = false;

    async function startRecording() {
      setPermissionError(null);
      audioChunksRef.current = [];

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Audio recording is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Setup live audio analyser for animated waveform
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          function updateWaveform() {
            if (!analyserRef.current || !isCancelled) {
              analyserRef.current?.getByteFrequencyData(dataArray);
              const sliced = Array.from(dataArray.slice(0, 16)).map((val) =>
                Math.max(15, Math.min(100, Math.round((val / 255) * 100)))
              );
              setAudioLevels(sliced);
              animFrameRef.current = requestAnimationFrame(updateWaveform);
            }
          }
          updateWaveform();
        } catch (e) {
          console.warn('AudioAnalyser visualizer error:', e);
        }

        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(finalBlob);
          setAudioBlob(finalBlob);
          setPreviewUrl(url);
          setIsRecording(false);
          cleanupStream();
        };

        recorder.start(100);
        setIsRecording(true);
        setRecordSeconds(0);

        timerRef.current = setInterval(() => {
          setRecordSeconds((prev) => {
            if (prev >= 180) {
              // Max 3 minutes
              stopRecording();
              return 180;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Microphone access error:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          } else {
            setPermissionError('Could not access microphone: ' + (err.message || 'Unknown error'));
          }
        }
      }
    }

    startRecording();

    return () => {
      isCancelled = true;
      cleanupStream();
    };
  }, [cleanupStream]);

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function handleSend() {
    if (audioBlob && previewUrl) {
      onSendVoiceNote(audioBlob, recordSeconds, previewUrl);
    }
  }

  function handleCancel() {
    cleanupStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel();
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return (
    <div className="p-3 bg-gradient-to-r from-rose-950/90 via-[#1A0B2E]/95 to-slate-950 border border-rose-500/40 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fadeIn text-white">
      {permissionError ? (
        <div className="flex items-center justify-between w-full gap-2 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{permissionError}</span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl font-bold"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <>
          {/* Status & Live Waveform */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black text-rose-300 font-mono">
                {formatTime(recordSeconds)}
              </span>
            </div>

            {/* Live Audio Visualizer Bars */}
            <div className="flex items-center gap-1 h-6 flex-1 max-w-[200px] overflow-hidden">
              {audioLevels.map((lvl, i) => (
                <div
                  key={i}
                  style={{ height: `${lvl}%` }}
                  className="w-1 bg-gradient-to-t from-rose-500 to-amber-300 rounded-full transition-all duration-75"
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Delete / Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md animate-pulse"
                title="Finish recording"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg hover:brightness-110 transition-all"
                title="Send Voice Note"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
