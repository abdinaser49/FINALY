
-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.expenses
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.expenses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.expenses
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.expenses
    FOR DELETE USING (true);
