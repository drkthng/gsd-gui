import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface PromptExperiment {
  id: string;
  name: string;
  model: string;
  tokens: number;
  score: number;
}

const MOCK_EXPERIMENTS: PromptExperiment[] = [
  { id: "p1", name: "Chain-of-Thought v2", model: "gpt-4o", tokens: 1240, score: 91 },
  { id: "p2", name: "Few-Shot Baseline", model: "claude-3", tokens: 860, score: 84 },
  { id: "p3", name: "ReAct Agent Prompt", model: "gpt-4o", tokens: 2100, score: 77 },
  { id: "p4", name: "Minimal System Msg", model: "claude-3", tokens: 320, score: 69 },
];

export function PromptLabPanel() {
  return (
    <ProToolPanel title="Prompt Lab" status="ready">
      <div className="grid gap-3">
        {MOCK_EXPERIMENTS.map((exp) => (
          <Card key={exp.id} data-testid={`prompt-${exp.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{exp.name}</CardTitle>
              <Badge variant="secondary">{exp.model}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {exp.tokens} tokens · Score: {exp.score}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
