import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useGsdStore, type PendingUIRequest } from "@/stores/gsd-store";

/**
 * Renders the first pending UI request from gsd-store as a dialog.
 * Supports: confirm (yes/no), select (radio group), input (text field), notify (auto-dismiss).
 */
export function UIRequestDialog() {
  const pendingUIRequests = useGsdStore((s) => s.pendingUIRequests);
  const respondToUIRequest = useGsdStore((s) => s.respondToUIRequest);

  const request = pendingUIRequests[0];
  if (!request) return null;

  return (
    <Dialog open={true} onOpenChange={() => respondToUIRequest(request.id, null)}>
      <DialogContent>
        <RequestBody request={request} onRespond={(response) => respondToUIRequest(request.id, response)} />
      </DialogContent>
    </Dialog>
  );
}

function RequestBody({ request, onRespond }: { request: PendingUIRequest; onRespond: (response: unknown) => void }) {
  const payload = (request.payload ?? {}) as Record<string, unknown>;
  const message = request.message ?? (payload?.message as string) ?? "Action required";

  switch (request.method) {
    case "confirm":
      return <ConfirmBody message={message} onRespond={onRespond} />;
    case "select":
      return <SelectBody message={message} options={payload?.options as { label: string }[] ?? []} onRespond={onRespond} />;
    case "input":
      return <InputBody message={message} onRespond={onRespond} />;
    case "notify":
      // notify is handled silently in the store — only reaches here if somehow queued
      onRespond(null);
      return null;
    default:
      // Unknown interactive method — dismiss silently
      onRespond(null);
      return null;
  }
}

function ConfirmBody({ message, onRespond }: { message: string; onRespond: (r: unknown) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onRespond(false)} aria-label="No">No</Button>
        <Button onClick={() => onRespond(true)} aria-label="Yes">Yes</Button>
      </DialogFooter>
    </>
  );
}

function SelectBody({ message, options, onRespond }: { message: string; options: { label: string }[]; onRespond: (r: unknown) => void }) {
  const [selected, setSelected] = useState(options[0]?.label ?? "");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
        {options.map((opt) => (
          <div key={opt.label} className="flex items-center gap-2">
            <RadioGroupItem value={opt.label} id={opt.label} />
            <Label htmlFor={opt.label}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
      <DialogFooter>
        <Button onClick={() => onRespond(selected)}>Confirm</Button>
      </DialogFooter>
    </>
  );
}

function InputBody({ message, onRespond }: { message: string; onRespond: (r: unknown) => void }) {
  const [value, setValue] = useState("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Input Required</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your response…" />
      <DialogFooter>
        <Button onClick={() => onRespond(value)} disabled={!value.trim()}>Submit</Button>
      </DialogFooter>
    </>
  );
}
