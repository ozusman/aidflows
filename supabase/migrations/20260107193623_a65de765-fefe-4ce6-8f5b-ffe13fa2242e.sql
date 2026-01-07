-- Create shifts table
CREATE TABLE public.shifts (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL,
  caregiver_name TEXT NOT NULL,
  caregiver_type TEXT NOT NULL,
  location_type TEXT NOT NULL,
  location_name TEXT NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_date DATE,
  travel_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  parking_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  purpose TEXT,
  medical_event TEXT,
  entered_by TEXT,
  shift_performed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_receipts table
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Public access policies for shifts (no auth yet)
CREATE POLICY "Allow public read access to shifts"
ON public.shifts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to shifts"
ON public.shifts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to shifts"
ON public.shifts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to shifts"
ON public.shifts FOR DELETE USING (true);

-- Public access policies for payment_receipts
CREATE POLICY "Allow public read access to payment_receipts"
ON public.payment_receipts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to payment_receipts"
ON public.payment_receipts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access to payment_receipts"
ON public.payment_receipts FOR DELETE USING (true);

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true);

-- Storage policies
CREATE POLICY "Allow public read access to payment-receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Allow public upload to payment-receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Allow public delete from payment-receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-receipts');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for shifts
CREATE TRIGGER update_shifts_updated_at
BEFORE UPDATE ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();