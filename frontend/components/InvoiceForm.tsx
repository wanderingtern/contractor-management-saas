import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backend from "~backend/client";
import type { LineItem } from "~backend/invoice/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LineItemForm extends Omit<LineItem, "id"> {
  id?: number;
}

export default function InvoiceForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState({
    customerId: 0,
    title: "",
    description: "",
    taxRate: 8.5,
    dueDate: "",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      itemType: "labor",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      sortOrder: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    if (isEdit) {
      loadInvoice();
    }
  }, [id]);

  const loadCustomers = async () => {
    try {
      const response = await backend.customer.list();
      setCustomers(response.customers.map(c => ({ id: c.id, name: c.name })));
      // Set first customer as default if creating new invoice
      if (!isEdit && response.customers.length > 0) {
        setFormData(prev => ({ ...prev, customerId: response.customers[0].id }));
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const loadInvoice = async () => {
    if (!id) return;
    try {
      const data = await backend.invoice.get({ id: parseInt(id) });
      setFormData({
        customerId: data.customerId,
        title: data.title,
        description: data.description || "",
        taxRate: data.taxRate,
        dueDate: data.dueDate || "",
        notes: data.notes || "",
      });
      setLineItems(data.lineItems);
    } catch (error) {
      console.error("Failed to load invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
      navigate("/invoices");
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        itemType: "labor",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
        sortOrder: lineItems.length,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate total when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : updated[index].quantity;
      const price = field === "unitPrice" ? parseFloat(value) || 0 : updated[index].unitPrice;
      updated[index].total = qty * price;
    }

    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTaxAmount = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate line items
    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        customerId: formData.customerId,
        title: formData.title,
        description: formData.description || undefined,
        taxRate: formData.taxRate,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
        lineItems: lineItems.map((item, index) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: parseFloat(item.quantity.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          total: parseFloat(item.total.toString()),
          sortOrder: index,
        })),
      };

      if (isEdit && id) {
        await backend.invoice.update({
          id: parseInt(id),
          ...payload,
        });
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        const result = await backend.invoice.create(payload);
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
        navigate(`/invoices/${result.id}`);
        return;
      }
      navigate(`/invoices/${id}`);
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} invoice`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === "number" ? parseFloat(e.target.value) : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const subtotal = calculateSubtotal();
  const taxAmount = calculateTaxAmount();
  const total = calculateTotal();

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEdit ? "Edit Invoice" : "New Invoice"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <select
                id="customerId"
                name="customerId"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerId: parseInt(e.target.value),
                  }))
                }
                required
              >
                <option value={0}>Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Service Invoice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%) *</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={handleChange}
                  required
                  placeholder="8.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the work..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" onClick={addLineItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-6">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={item.itemType}
                        onChange={(e) =>
                          updateLineItem(index, "itemType", e.target.value)
                        }
                      >
                        <option value="labor">Labor</option>
                        <option value="material">Material</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        required
                        placeholder="Item description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, "quantity", e.target.value)
                        }
                        required
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, "unitPrice", e.target.value)
                        }
                        required
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        value={`$${item.total.toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-full md:w-1/2 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({formData.taxRate}%):
                  </span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Invoice"
              : "Create Invoice"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
