
-- 1. Drop public storage policies on payment-receipts bucket
DROP POLICY IF EXISTS "Allow public delete from payment-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to payment-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to payment-receipts" ON storage.objects;

-- 2. Fix function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Add DB constraints on shifts
ALTER TABLE public.shifts
  ADD CONSTRAINT shifts_text_length_check CHECK (
    length(caregiver_name) <= 200
    AND length(location_name) <= 200
    AND (notes IS NULL OR length(notes) <= 5000)
    AND (entered_by IS NULL OR length(entered_by) <= 100)
  ),
  ADD CONSTRAINT shifts_value_range_check CHECK (
    travel_cost >= 0 AND travel_cost <= 10000
    AND parking_cost >= 0 AND parking_cost <= 1000
    AND total_hours >= 0 AND total_hours <= 24
    AND payment_amount >= 0
  );

-- Caregivers length constraint
ALTER TABLE public.caregivers
  ADD CONSTRAINT caregivers_name_length_check CHECK (length(name) <= 200);
