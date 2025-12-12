import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { Estimate, Photo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PhotoUpload from "./PhotoUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EstimateDetail() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadEstimate();
    loadPhotos();
  }, [id]);

  const loadEstimate = async () => {
    if (!id) return;
    try {
      const data = await api.estimate.get({ id: parseInt(id) });
      setEstimate(data);
    } catch (error) {
      console.error("Failed to load estimate:", error);
      toast({
        title: "Error",
        description: "Failed to load estimate",
        variant: "destructive",
      });
      navigate("/estimates");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    if (!id) return;
    try {
      const response = await api.photo.list({ estimateId: parseInt(id) });
      setPhotos(response.photos);
    } catch (error) {
      console.error("Failed to load photos:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.estimate.deleteEstimate({ id: parseInt(id) });
      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
      navigate("/estimates");
    } catch (error) {
      console.error("Failed to delete estimate:", error);
      toast({
        title: "Error",
        description: "Failed to delete estimate",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    try {
      const result = await api.estimate.approve({ id: parseInt(id) });
      toast({
        title: "Success",
        description: `Estimate approved! Invoice ${result.invoiceId} created.`,
      });
      // Navigate to the new invoice
      navigate(`/invoices/${result.invoiceId}`);
    } catch (error) {
      console.error("Failed to approve estimate:", error);
      toast({
        title: "Error",
        description: "Failed to approve estimate",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const canEdit = estimate.status !== "approved";
  const canApprove = estimate.status === "sent" || estimate.status === "draft";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/estimates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Estimates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {estimate.estimateNumber}
              </CardTitle>
              <p className="text-lg text-muted-foreground mt-1">{estimate.title}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canApprove && (
                <Button onClick={handleApprove} disabled={approving} variant="default">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approving ? "Approving..." : "Approve & Create Invoice"}
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => navigate(`/estimates/${id}/edit`)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the estimate.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and metadata */}
          <div className="grid gap-4 md:grid-cols-3 pb-4 border-b">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-base font-semibold uppercase">{estimate.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-base">{new Date(estimate.createdAt).toLocaleDateString()}</p>
            </div>
            {estimate.validUntil && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                <p className="text-base">{new Date(estimate.validUntil).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {estimate.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-base">{estimate.description}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Line Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Type</th>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-right p-3 text-sm font-medium">Qty</th>
                    <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lineItems.map((item, index) => (
                    <tr key={item.id || index} className="border-t">
                      <td className="p-3 text-sm capitalize">{item.itemType}</td>
                      <td className="p-3 text-sm">{item.description}</td>
                      <td className="p-3 text-sm text-right">{item.quantity}</td>
                      <td className="p-3 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-sm text-right font-medium">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${estimate.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({estimate.taxRate}%):</span>
                <span className="font-medium">${estimate.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${estimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {estimate.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-base whitespace-pre-wrap">{estimate.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Section */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Photos</h2>
        <PhotoUpload
          entityType="estimate"
          entityId={parseInt(id!)}
          photos={photos}
          onPhotosChange={loadPhotos}
        />
      </div>
    </div>
  );
}
