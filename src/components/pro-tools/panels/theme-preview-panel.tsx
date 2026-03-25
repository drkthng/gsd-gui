import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface ThemeEntry {
  id: string;
  name: string;
  primaryColor: string;
  mode: "light" | "dark" | "system";
  active: boolean;
}

const MOCK_THEMES: ThemeEntry[] = [
  { id: "th1", name: "Default Dark", primaryColor: "#7c3aed", mode: "dark", active: true },
  { id: "th2", name: "Ocean Light", primaryColor: "#0ea5e9", mode: "light", active: false },
  { id: "th3", name: "Forest", primaryColor: "#22c55e", mode: "system", active: false },
  { id: "th4", name: "Sunset", primaryColor: "#f97316", mode: "light", active: false },
];

const MODE_VARIANT: Record<ThemeEntry["mode"], "default" | "secondary" | "destructive"> = {
  dark: "default",
  light: "secondary",
  system: "destructive",
};

export function ThemePreviewPanel() {
  return (
    <ProToolPanel title="Theme Preview" status="ready">
      <div className="grid gap-3">
        {MOCK_THEMES.map((t) => (
          <Card key={t.id} data-testid={`theme-${t.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: t.primaryColor }} />
                {t.name}
              </CardTitle>
              <Badge variant={MODE_VARIANT[t.mode]}>{t.mode}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {t.primaryColor} · {t.active ? "Active" : "Inactive"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
