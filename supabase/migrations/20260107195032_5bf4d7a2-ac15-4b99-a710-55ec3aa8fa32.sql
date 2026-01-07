-- Make the payment-receipts bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'payment-receipts';

-- Add user_id column to shifts table for ownership
ALTER TABLE public.shifts 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to payment_receipts table
ALTER TABLE public.payment_receipts 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public RLS policies on shifts
DROP POLICY IF EXISTS "Allow public delete access to shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow public insert access to shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow public read access to shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow public update access to shifts" ON public.shifts;

-- Drop existing public RLS policies on payment_receipts
DROP POLICY IF EXISTS "Allow public delete access to payment_receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Allow public insert access to payment_receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Allow public read access to payment_receipts" ON public.payment_receipts;

-- Create new user-scoped RLS policies for shifts
CREATE POLICY "Users can view their own shifts"
ON public.shifts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts"
ON public.shifts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts"
ON public.shifts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts"
ON public.shifts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create new user-scoped RLS policies for payment_receipts
CREATE POLICY "Users can view their own receipts"
ON public.payment_receipts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipts"
ON public.payment_receipts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
ON public.payment_receipts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
ON public.payment_receipts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Storage policies for payment-receipts bucket
CREATE POLICY "Users can view their own receipt files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own receipt files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipt files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);