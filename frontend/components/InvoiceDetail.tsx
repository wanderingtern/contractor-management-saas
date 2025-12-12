import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backend from "~backend/client";
import type { Invoice } from "~backend/invoice/types";
import type { Photo } from "~backend/photo/upload";
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
import { ArrowLeft, Edit, Trash2, CreditCard, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadInvoice();
    loadPhotos();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    try {
      const data = await backend.invoice.get({ id: parseInt(id) });
      setInvoice(data);
    } catch (error) {
      console.error("Failed to load invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    if (!id) return;
    try {
      const response = await backend.photo.list({ invoiceId: parseInt(id) });
      setPhotos(response.photos);
    } catch (error) {
      console.error("Failed to load photos:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await backend.invoice.deleteInvoice({ id: parseInt(id) });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      navigate("/invoices");
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    try {
      await backend.invoice.update({
        id: parseInt(id),
        status: "paid",
      });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
      loadInvoice();
    } catch (error) {
      console.error("Failed to update invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const canEdit = invoice.status !== "paid" && invoice.status !== "cancelled";
  const canMarkPaid = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                {invoice.invoiceNumber}
              </CardTitle>
              <p className="text-lg text-muted-foreground mt-1">{invoice.title}</p>
              {invoice.estimateId && (
                <p className="text-sm text-muted-foreground mt-1">
                  Created from estimate #{invoice.estimateId}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {canMarkPaid && (
                <Button onClick={handleMarkAsPaid} variant="default">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => navigate(`/invoices/${id}/edit`)} variant="outline">
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
                        This action cannot be undone. This will permanently delete the invoice.
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
              <p className="text-base font-semibold uppercase">{invoice.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Issued</p>
              <p className="text-base">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-base">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {invoice.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-base">{invoice.description}</p>
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
                  {invoice.lineItems.map((item, index) => (
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
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid:</span>
                    <span className="font-medium">${invoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Balance Due:</span>
                    <span>${(invoice.total - invoice.amountPaid).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-base whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Section */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Photos</h2>
        <PhotoUpload
          entityType="invoice"
          entityId={parseInt(id!)}
          photos={photos}
          onPhotosChange={loadPhotos}
        />
      </div>
    </div>
  );
}
