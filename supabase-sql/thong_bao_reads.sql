-- Tracks the first time each application user opens a notification.
CREATE TABLE IF NOT EXISTS public.thong_bao_reads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thong_bao_id uuid NOT NULL REFERENCES public.thong_bao(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    clicked_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT thong_bao_reads_notification_user_key UNIQUE (thong_bao_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thong_bao_reads_user_notification
    ON public.thong_bao_reads (user_id, thong_bao_id);

ALTER TABLE public.thong_bao_reads ENABLE ROW LEVEL SECURITY;

-- This project authenticates against public.users instead of Supabase Auth,
-- so auth.uid() is unavailable. These policies match the existing app model.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'thong_bao_reads'
          AND policyname = 'Allow reading notification click logs'
    ) THEN
        CREATE POLICY "Allow reading notification click logs"
            ON public.thong_bao_reads FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'thong_bao_reads'
          AND policyname = 'Allow inserting notification click logs'
    ) THEN
        CREATE POLICY "Allow inserting notification click logs"
            ON public.thong_bao_reads FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
