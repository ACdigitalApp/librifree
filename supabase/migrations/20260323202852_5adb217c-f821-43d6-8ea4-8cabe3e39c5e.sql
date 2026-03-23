
-- Allow the trigger (SECURITY DEFINER) to insert profiles
-- The handle_new_user trigger runs as SECURITY DEFINER so it bypasses RLS,
-- but we also need a policy for service_role inserts
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile (fallback)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
