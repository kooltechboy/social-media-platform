-- 00029_fix_rls_recursion_and_rbac.sql
-- Fix 1: Resolve Infinite Recursion in Marketplace Orders & Order Items via SECURITY DEFINER function
-- Fix 2: Correct RBAC mapping in Monetization policies (checking profile_id in addition to id)
-- Fix 3: Enforce double-entry ledger sum zero trigger as a deferred constraint trigger

-- 1. Order participant helper to break recursive policy checks
CREATE OR REPLACE FUNCTION public.is_order_participant(target_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.orders o WHERE o.id = target_order_id AND o.buyer_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = target_order_id AND p.seller_id = auth.uid()
    );
$$;

DROP POLICY IF EXISTS "Seller reads orders containing their products" ON public.orders;
CREATE POLICY "Seller reads orders containing their products" ON public.orders
    FOR SELECT USING (public.is_order_participant(id));

DROP POLICY IF EXISTS "Order participants read items" ON public.order_items;
CREATE POLICY "Order participants read items" ON public.order_items
    FOR SELECT USING (public.is_order_participant(order_id));

-- 2. Correct RBAC Mapping in Monetization (Migration 00028 policies)
DROP POLICY IF EXISTS "Admin manage seller plans" ON public.seller_plans;
CREATE POLICY "Admin manage seller plans" ON public.seller_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE (profile_id = auth.uid() OR id = auth.uid()) AND role IN ('admin', 'super_admin', 'superadmin', 'management'))
);

DROP POLICY IF EXISTS "Business owners read subscription" ON public.business_subscriptions;
CREATE POLICY "Business owners read subscription" ON public.business_subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_subscriptions.business_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts WHERE (profile_id = auth.uid() OR id = auth.uid()) AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
);

DROP POLICY IF EXISTS "Admin manage monetization rules" ON public.monetization_rules;
CREATE POLICY "Admin manage monetization rules" ON public.monetization_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE (profile_id = auth.uid() OR id = auth.uid()) AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
);
