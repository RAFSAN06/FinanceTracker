import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Category } from '@/types';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name is required and must be at least 2 characters' }),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, { message: 'Must be a valid hex color code' })
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialValues?: Category;
  isEditing?: boolean;
  onSuccess: () => void;
}

export function CategoryForm({ initialValues, isEditing = false, onSuccess }: CategoryFormProps) {
  const { addCategory, updateCategory } = useFinance();

  const defaultValues: FormValues = {
    name: initialValues?.name || '',
    type: initialValues?.type || 'expense',
    color: initialValues?.color || '#6366F1' // Default to indigo
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [colorValue, setColorValue] = useState(defaultValues.color);
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorValue(e.target.value);
    form.setValue('color', e.target.value);
  };

  const predefinedColors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
  ];

  const onSubmit = (data: FormValues) => {
    if (isEditing && initialValues) {
      updateCategory({
        id: initialValues.id,
        ...data
      });
    } else {
      addCategory(data);
    }
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Color</FormLabel>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-md" 
                  style={{ backgroundColor: colorValue }}
                />
                <FormControl>
                  <Input 
                    type="text"
                    placeholder="#RRGGBB"
                    {...field}
                    value={colorValue}
                    onChange={handleColorChange}
                  />
                </FormControl>
              </div>
              <FormDescription>
                Choose from predefined colors or enter a hex code
              </FormDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded-md border border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setColorValue(color);
                      form.setValue('color', color);
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  );
}