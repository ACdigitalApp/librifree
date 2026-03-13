-- Allow authenticated admin users to upload to book-covers bucket
CREATE POLICY "Authenticated users can upload book covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers');

-- Allow authenticated admin users to update book covers
CREATE POLICY "Authenticated users can update book covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers')
WITH CHECK (bucket_id = 'book-covers');