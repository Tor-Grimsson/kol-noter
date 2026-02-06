import { useState, useRef } from "react";
import { Button } from "@/components/ui-elements/atoms/Button";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceMemo {
  id: string;
  timestamp: Date;
  audioUrl: string;
  duration: number;
}

interface VoiceRecorderProps {
  onMemosChange?: (memos: VoiceMemo[]) => void;
}

export const VoiceRecorder = ({ onMemosChange }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Date.now() - startTimeRef.current;

        const newMemo: VoiceMemo = {
          id: Date.now().toString(),
          timestamp: new Date(),
          audioUrl,
          duration,
        };

        const updatedMemos = [...memos, newMemo];
        setMemos(updatedMemos);
        onMemosChange?.(updatedMemos);
        
        stream.getTracks().forEach(track => track.stop());
        toast.success("Voice memo saved");
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(Date.now() - startTimeRef.current);
      }, 100);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playMemo = (memo: VoiceMemo) => {
    if (playingId === memo.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(memo.audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingId(null);
      };
      
      audio.play();
      setPlayingId(memo.id);
    }
  };

  const deleteMemo = (id: string) => {
    const updatedMemos = memos.filter(memo => memo.id !== id);
    setMemos(updatedMemos);
    onMemosChange?.(updatedMemos);
    
    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    
    toast.success("Voice memo deleted");
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card/50">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="gap-2"
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Record Voice Memo
            </>
          )}
        </Button>

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {memos.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Voice Memos ({memos.length})
          </div>
          
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playMemo(memo)}
                className="flex-shrink-0"
              >
                {playingId === memo.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {formatDate(memo.timestamp)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Duration: {formatTime(memo.duration)}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMemo(memo.id)}
                className="flex-shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
