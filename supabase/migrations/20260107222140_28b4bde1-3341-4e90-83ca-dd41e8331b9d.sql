-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Users can view their own caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Users can update their own caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Users can delete their own caregivers" ON public.caregivers;

DROP POLICY IF EXISTS "Users can create their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can delete their own shifts" ON public.shifts;

-- Recreate as PERMISSIVE policies for caregivers
CREATE POLICY "Users can view their own caregivers" 
ON public.caregivers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caregivers" 
ON public.caregivers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregivers" 
ON public.caregivers 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregivers" 
ON public.caregivers 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Recreate as PERMISSIVE policies for shifts
CREATE POLICY "Users can view their own shifts" 
ON public.shifts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts" 
ON public.shifts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts" 
ON public.shifts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts" 
ON public.shifts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);