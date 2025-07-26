import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { autoCategorizeTransaction } from '@/lib/finance-utils';
import { useState } from 'react';

const formSchema = z.object({
  description: z.string().min(2, { message: 'Description is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  date: z.date(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, { message: 'Please select a category' }),
  recurring: z.boolean().default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.date().optional().nullable(),
  receiptImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initialValues?: Transaction;
  isEditing?: boolean;
  onSuccess: () => void;
}

export function TransactionForm({ initialValues, isEditing = false, onSuccess }: TransactionFormProps) {
  const { addTransaction, updateTransaction, categories, preferences } = useFinance();
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.receiptURL || null);
  
  // Create default values for the form
  const defaultValues: Partial<FormValues> = {
    description: initialValues?.description || '',
    amount: initialValues?.amount || 0,
    date: initialValues?.date ? new Date(initialValues.date) : new Date(),
    type: initialValues?.type || 'expense',
    categoryId: initialValues?.categoryId || '',
    recurring: !!initialValues?.recurring,
    recurringFrequency: initialValues?.recurring?.frequency,
    recurringEndDate: initialValues?.recurring?.endDate ? new Date(initialValues.recurring.endDate) : null,
    receiptImage: initialValues?.receiptURL,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, setValue } = form;
  const transactionType = watch('type');
  const isRecurring = watch('recurring');
  const description = watch('description');
  const amount = watch('amount');
  
  const filteredCategories = categories.filter(category => category.type === transactionType);

  // Auto-categorize when description changes
  const handleDescriptionBlur = () => {
    const currentCategoryId = form.getValues('categoryId');
    // Only auto-categorize if no category is selected yet
    if (!currentCategoryId && description && preferences.autoCategorization) {
      const suggestedCategoryId = autoCategorizeTransaction(description, amount, transactionType, categories);
      if (suggestedCategoryId) {
        setValue('categoryId', suggestedCategoryId);
      }
    }
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setImagePreview(base64String);
        setValue('receiptImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: FormValues) {
    try {
      const transaction: Omit<Transaction, 'id'> = {
        description: data.description,
        amount: data.amount,
        date: format(data.date, 'yyyy-MM-dd'),
        type: data.type,
        categoryId: data.categoryId,
        ...(data.recurring && {
          recurring: {
            frequency: data.recurringFrequency!,
            endDate: data.recurringEndDate ? format(data.recurringEndDate, 'yyyy-MM-dd') : undefined,
            lastProcessed: format(data.date, 'yyyy-MM-dd'),
          },
        }),
        receiptURL: data.receiptImage,
      };

      if (isEditing && initialValues) {
        updateTransaction({ ...transaction, id: initialValues.id });
      } else {
        addTransaction(transaction);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1 col-span-2">
                <FormLabel>Transaction Type</FormLabel>
                <RadioGroup 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal text-green-600">Income</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal text-red-600">Expense</FormLabel>
                  </FormItem>
                </RadioGroup>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter description" 
                    {...field} 
                    onBlur={handleDescriptionBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">{preferences.currency === 'USD' ? '$' : preferences.currency}</span>
                    </div>
                    <Input 
                      placeholder="0.00" 
                      className="pl-8" 
                      type="number" 
                      step="0.01" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, preferences.dateFormat)
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map(category => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="flex items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between col-span-2 space-y-0 rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Recurring Transaction</FormLabel>
                  <FormDescription>
                    Set this transaction to repeat automatically
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
          
          {isRecurring && (
            <>
              <FormField
                control={form.control}
                name="recurringFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recurringEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, preferences.dateFormat)
                            ) : (
                              <span>No end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave empty for indefinite recurring
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <div className="col-span-2">
            <FormLabel>Attach Receipt (Optional)</FormLabel>
            <div className="mt-2 flex items-center gap-3">
              <label 
                htmlFor="receipt-upload" 
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </label>
              <input 
                id="receipt-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview && (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Receipt" 
                    className="h-16 w-16 object-cover rounded-md" 
                  />
                  <Button 
                    variant="destructive" 
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => {
                      setImagePreview(null);
                      setValue('receiptImage', undefined);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}