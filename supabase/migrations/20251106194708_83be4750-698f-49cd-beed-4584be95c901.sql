-- Promote user to admin role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '6b1bc13c-b6a7-4887-bee5-650521319694';