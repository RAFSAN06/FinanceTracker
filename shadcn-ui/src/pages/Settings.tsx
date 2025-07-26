import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useFinance } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Moon, Sun, Laptop, Trash2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { exportData, exportDataAsCSV } from '@/lib/storage';
import { format } from 'date-fns';

const formSchema = z.object({
  currency: z.string().min(1, { message: 'Please select a currency' }),
  dateFormat: z.string().min(1, { message: 'Please select a date format' }),
  notifications: z.boolean().default(true),
  autoCategorization: z.boolean().default(true),
});

export default function Settings() {
  const { preferences, updatePreferences } = useFinance();
  const { theme, setTheme } = useTheme();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: preferences.currency,
      dateFormat: preferences.dateFormat,
      notifications: preferences.notifications,
      autoCategorization: preferences.autoCategorization,
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    updatePreferences(values);
    alert('Settings saved successfully!');
  }
  
  const resetLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };
  
  const handleBackup = () => {
    // Create backup files
    const jsonBackup = exportData();
    const csvBackup = exportDataAsCSV();
    
    // Create Blob objects
    const jsonBlob = new Blob([jsonBackup], { type: 'application/json' });
    const csvBlob = new Blob([csvBackup], { type: 'text/csv' });
    
    // Create download links
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const csvUrl = URL.createObjectURL(csvBlob);
    
    // Set file names with current date
    const date = format(new Date(), 'yyyy-MM-dd');
    const jsonFilename = `finance-tracker-backup-${date}.json`;
    const csvFilename = `finance-tracker-backup-${date}.csv`;
    
    // Create download links
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = jsonFilename;
    
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = csvFilename;
    
    // Click the links to trigger downloads
    jsonLink.click();
    setTimeout(() => csvLink.click(), 100); // Small delay to ensure proper download order
    
    // Clean up
    URL.revokeObjectURL(jsonUrl);
    URL.revokeObjectURL(csvUrl);
    
    setShowBackupDialog(false);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Configure how the application looks and behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Theme Preference</h3>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <label htmlFor="light" className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <label htmlFor="dark" className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <label htmlFor="system" className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <Laptop className="h-4 w-4" />
                  <span>System Default</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your preferred currency for displaying amounts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a date format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (US)</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (EU)</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                        <SelectItem value="dd.MM.yyyy">DD.MM.YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how dates are displayed throughout the app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Notifications
                      </FormLabel>
                      <FormDescription>
                        Enable spending alerts and notifications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoCategorization"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-Categorization
                      </FormLabel>
                      <FormDescription>
                        Automatically suggest categories based on transaction descriptions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Save Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Backup, export, and manage your financial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
              Backup Data
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" className="w-full">
                Import Data
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const jsonData = JSON.parse(event.target?.result as string);
                        localStorage.setItem('finance-tracker-data', JSON.stringify(jsonData));
                        alert('Data imported successfully!');
                        window.location.reload();
                      } catch (error) {
                        alert('Invalid data format');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription>
              The following actions are destructive and cannot be undone.
            </AlertDescription>
          </Alert>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Application Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all your financial data, categories, and settings.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetLocalStorage}>Reset Data</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      
      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Backup Your Data</DialogTitle>
            <DialogDescription>
              Create a backup of your financial data in JSON and CSV formats.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Clicking "Download Backup" will save two files to your device:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>A JSON file containing all your data (for future imports)</li>
              <li>A CSV file for viewing in spreadsheet applications</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button onClick={handleBackup}>Download Backup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}