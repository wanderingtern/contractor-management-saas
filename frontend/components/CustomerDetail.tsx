import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backend from "~backend/client";
import type { Customer } from "~backend/customer/create";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;
    try {
      const data = await backend.customer.get({ id: parseInt(id) });
      setCustomer(data);
    } catch (error) {
      console.error("Failed to load customer:", error);
      toast({
        title: "Error",
        description: "Failed to load customer",
        variant: "destructive",
      });
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await backend.customer.deleteCustomer({ id: parseInt(id) });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      navigate("/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
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

  if (!customer) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
              <User className="h-6 w-6" />
              {customer.name}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/customers/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
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
                      This action cannot be undone. This will permanently delete the customer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-base">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-base">{customer.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="flex items-start gap-3 pt-4 border-t">
              <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="text-base whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
