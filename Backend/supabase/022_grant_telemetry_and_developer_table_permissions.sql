-- Migration 022: Grant permissions on login_failures and system_developers to service_role and authenticated

GRANT ALL ON TABLE public.login_failures TO service_role;
GRANT ALL ON TABLE public.system_developers TO service_role;
GRANT SELECT ON TABLE public.system_developers TO authenticated;
