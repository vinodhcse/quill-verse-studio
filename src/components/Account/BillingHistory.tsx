
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BillingRecord {
  id: string;
  subscription_id: string;
  billedDate: string;
  dueDate: string;
  paidDate: string;
  dueAmount: number;
  paidAmount: number;
  paymentMethod: string;
  status: 'active' | 'paid' | 'pending' | 'failed';
}

// Mock data - this should come from API
const billingHistory: BillingRecord[] = [
  {
    id: '1254',
    subscription_id: 'sub_456',
    billedDate: '2024-12-13T00:00:00Z',
    dueDate: '2024-12-20T00:00:00Z',
    paidDate: '2024-12-15T00:00:00Z',
    dueAmount: 5.99,
    paidAmount: 5.99,
    paymentMethod: 'Visa',
    status: 'paid'
  },
  {
    id: '1253',
    subscription_id: 'sub_456',
    billedDate: '2024-11-13T00:00:00Z',
    dueDate: '2024-11-20T00:00:00Z',
    paidDate: '2024-11-14T00:00:00Z',
    dueAmount: 5.99,
    paidAmount: 5.99,
    paymentMethod: 'Stripe',
    status: 'paid'
  }
];

export const BillingHistory = () => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing History</h1>
        <p className="text-muted-foreground mt-2">View your payment history and download invoices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.billedDate)}</TableCell>
                  <TableCell>{formatDate(record.dueDate)}</TableCell>
                  <TableCell className="font-medium">${record.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>{record.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4 mr-2" />
                      Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
