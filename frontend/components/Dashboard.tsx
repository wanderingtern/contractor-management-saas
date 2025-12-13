import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backend from "~backend/client";
import type { Customer } from "~backend/customer/create";
import type { Estimate } from "~backend/estimate/types";
import type { Invoice } from "~backend/invoice/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEstimates: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    revenue: 0,
  });

  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentEstimates, setRecentEstimates] = useState<
    Omit<Estimate, "lineItems">[]
  >([]);
  const [recentInvoices, setRecentInvoices] = useState<
    Omit<Invoice, "lineItems">[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [customersRes, estimatesRes, invoicesRes] = await Promise.all([
        backend.customer.list(),
        backend.estimate.list({}),
        backend.invoice.list({}),
      ]);

      const customers = customersRes.customers;
      const estimates = estimatesRes.estimates;
      const invoices = invoicesRes.invoices;

      const pendingCount = invoices.filter(
        (inv) => inv.status !== "paid" && inv.status !== "cancelled"
      ).length;

      const totalRevenue = invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.total, 0);

      setStats({
        totalCustomers: customers.length,
        totalEstimates: estimates.length,
        totalInvoices: invoices.length,
        pendingInvoices: pendingCount,
        revenue: totalRevenue,
      });

      setRecentCustomers(customers.slice(0, 5));
      setRecentEstimates(estimates.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <Button
                variant="link"
                className="px-0 text-xs mt-1"
                onClick={() => navigate("/customers")}
              >
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEstimates}</div>
              <Button
                variant="link"
                className="px-0 text-xs mt-1"
                onClick={() => navigate("/estimates")}
              >
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Invoices
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.totalInvoices} total
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From paid invoices
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-center font-semibold mb-2">Add Customer</h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Create a new customer profile
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/customers/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-center font-semibold mb-2">New Estimate</h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Create an estimate for a customer
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/estimates/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Estimate
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-center font-semibold mb-2">New Invoice</h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Create an invoice for a customer
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/invoices/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Customers</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/customers")}
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No customers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Estimates</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/estimates")}
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentEstimates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No estimates yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEstimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/estimates/${estimate.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{estimate.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {estimate.estimateNumber} • ${estimate.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          estimate.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : estimate.status === "sent"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {estimate.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Invoices</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/invoices")}
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{invoice.invoiceNumber}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {invoice.total.toFixed(2)}
                            </span>
                            {invoice.dueDate && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due {new Date(invoice.dueDate).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.status === "sent"
                            ? "bg-blue-100 text-blue-800"
                            : invoice.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
