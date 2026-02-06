import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'meal-images';

export async function uploadMealImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/** Upload from base64 (e.g. after client compression) - for compatibility with existing flow */
export async function uploadMealImageFromBase64(
  userId: string,
  base64DataUrl: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  const byteChars = atob(base64Data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
