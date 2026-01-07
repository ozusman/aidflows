-- Create caregivers table to store unique caregivers
CREATE TABLE public.caregivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  caregiver_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own caregivers"
ON public.caregivers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caregivers"
ON public.caregivers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregivers"
ON public.caregivers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregivers"
ON public.caregivers
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_caregivers_updated_at
BEFORE UPDATE ON public.caregivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();