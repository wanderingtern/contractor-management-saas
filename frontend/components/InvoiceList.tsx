import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backend from "~backend/client";
import type { Invoice } from "~backend/invoice/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, DollarSign, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Omit<Invoice, "lineItems">[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await backend.invoice.list({});
      setInvoices(response.invoices);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Invoices</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/estimates")} variant="outline">
            View Estimates
          </Button>
          <Button onClick={() => navigate("/invoices/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No invoices yet</p>
            <p className="text-sm mt-2">Approve an estimate to create your first invoice</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {invoice.invoiceNumber} - {invoice.title}
                  </CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ${invoice.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Issued: {new Date(invoice.createdAt).toLocaleDateString()}
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {invoice.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {invoice.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
