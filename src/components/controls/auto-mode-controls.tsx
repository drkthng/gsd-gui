import { useState } from "react";
import { Play, Square, SkipForward, Navigation, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * Auto mode execution controls — start/stop, next step, steer.
 * Button visibility changes based on session and streaming state.
 * Uses dedicated store actions that send proper RPC commands.
 */
export function AutoModeControls() {
  const isStreaming = useGsdStore((s) => s.isStreaming);
  const sessionState = useGsdStore((s) => s.sessionState);
  const autoMode = useGsdStore((s) => s.autoMode);
  const startAuto = useGsdStore((s) => s.startAuto);
  const stopAuto = useGsdStore((s) => s.stopAuto);
  const nextStep = useGsdStore((s) => s.nextStep);
  const steerExecution = useGsdStore((s) => s.steerExecution);

  const [steerText, setSteerText] = useState("");
  const [showSteerInput, setShowSteerInput] = useState(false);

  const isConnected = sessionState === "connected" || sessionState === "streaming";

  const handleSteerSubmit = () => {
    const trimmed = steerText.trim();
    if (trimmed) {
      steerExecution(trimmed);
      setSteerText("");
      setShowSteerInput(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isStreaming || autoMode ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopAuto()}
          aria-label="Stop auto mode"
        >
          <Square className="mr-1 h-3.5 w-3.5" />
          Stop
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => startAuto()}
          disabled={!isConnected}
          aria-label="Start auto mode"
        >
          <Play className="mr-1 h-3.5 w-3.5" />
          Start Auto
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => nextStep()}
        disabled={!isConnected || isStreaming}
        aria-label="Next step"
      >
        <SkipForward className="mr-1 h-3.5 w-3.5" />
        Next Step
      </Button>

      {isStreaming && !showSteerInput && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSteerInput(true)}
          aria-label="Steer execution"
        >
          <Navigation className="mr-1 h-3.5 w-3.5" />
          Steer
        </Button>
      )}

      {showSteerInput && (
        <div className="flex items-center gap-1">
          <Input
            value={steerText}
            onChange={(e) => setSteerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSteerSubmit();
              if (e.key === "Escape") {
                setShowSteerInput(false);
                setSteerText("");
              }
            }}
            placeholder="Steer instruction..."
            className="h-8 w-48 text-sm"
            aria-label="Steer input"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSteerSubmit}
            disabled={!steerText.trim()}
            aria-label="Send steer"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
