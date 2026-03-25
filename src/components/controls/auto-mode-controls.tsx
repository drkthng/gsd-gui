import { Play, Pause, SkipForward, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * Auto mode execution controls — start/pause/stop, next step, steer.
 * Button visibility changes based on session and streaming state.
 */
export function AutoModeControls() {
  const isStreaming = useGsdStore((s) => s.isStreaming);
  const sessionState = useGsdStore((s) => s.sessionState);
  const sendPrompt = useGsdStore((s) => s.sendPrompt);

  const isConnected = sessionState === "connected" || sessionState === "streaming";

  return (
    <div className="flex items-center gap-2">
      {isStreaming ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendPrompt("/gsd stop")}
          aria-label="Pause auto mode"
        >
          <Pause className="mr-1 h-3.5 w-3.5" />
          Pause
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendPrompt("/gsd auto")}
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
        onClick={() => sendPrompt("/gsd next")}
        disabled={!isConnected || isStreaming}
        aria-label="Next step"
      >
        <SkipForward className="mr-1 h-3.5 w-3.5" />
        Next Step
      </Button>

      {isStreaming && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const text = prompt("Steer instruction:");
            if (text) sendPrompt(text);
          }}
          aria-label="Steer execution"
        >
          <Navigation className="mr-1 h-3.5 w-3.5" />
          Steer
        </Button>
      )}
    </div>
  );
}
