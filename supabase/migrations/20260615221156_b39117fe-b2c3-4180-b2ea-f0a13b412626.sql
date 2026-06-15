CREATE POLICY "Users can update their own receipt files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'payment-receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);