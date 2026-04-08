import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function SignaturePanel() {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleAction = (action: "approve" | "reject") => {
    toast({
      title: action === "approve" ? "Batch Approved" : "Batch Rejected",
      description: `Action completed with notes: ${notes || "No notes"}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Digital Signature Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add inspection notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => handleAction("approve")}>
            <CheckCircle className="h-4 w-4 mr-2" /> Approve & Sign
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => handleAction("reject")}>
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
