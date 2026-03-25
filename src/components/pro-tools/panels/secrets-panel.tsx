import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface Secret {
  id: string;
  name: string;
  source: "env" | "vault" | "config";
  maskedValue: string;
}

const MOCK_SECRETS: Secret[] = [
  { id: "sec1", name: "OPENAI_API_KEY", source: "env", maskedValue: "sk-****" },
  { id: "sec2", name: "DATABASE_URL", source: "vault", maskedValue: "postgres://****" },
  { id: "sec3", name: "GITHUB_TOKEN", source: "env", maskedValue: "ghp_****" },
  { id: "sec4", name: "ENCRYPTION_KEY", source: "config", maskedValue: "aes-****" },
];

const SOURCE_VARIANT: Record<Secret["source"], "default" | "secondary" | "outline"> = {
  env: "default",
  vault: "secondary",
  config: "outline",
};

export function SecretsPanel() {
  return (
    <ProToolPanel title="Secrets" status="ready">
      <div className="grid gap-3">
        {MOCK_SECRETS.map((secret) => (
          <Card key={secret.id} data-testid={`secret-${secret.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{secret.name}</CardTitle>
              <Badge variant={SOURCE_VARIANT[secret.source]}>{secret.source}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground font-mono">{secret.maskedValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
