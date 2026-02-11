-- Passkey credentials for WebAuthn sign-in
CREATE TABLE IF NOT EXISTS public.passkey_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON public.passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON public.passkey_credentials(credential_id);

ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- No policies: anon/key users cannot access. Edge Functions use service role which bypasses RLS.
