-- Create meal-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-images',
  'meal-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS: users can upload/read/delete their own meal images (path: userId/filename)
CREATE POLICY "Users can upload meal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their meal images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their meal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Rate limiting for analyze-food: track requests per user per hour
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, endpoint)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
-- RLS: no user access; edge function uses service role
