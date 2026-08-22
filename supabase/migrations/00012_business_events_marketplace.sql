-- Migration 00012: Business Network, Events & Marketplace
-- Description: business profiles with locations/reviews, products, orders, events with attendees and tickets

CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    category VARCHAR(40) NOT NULL,
    description TEXT,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    phone VARCHAR(30),
    website TEXT,
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.business_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    city_id UUID REFERENCES public.cities(id),
    address TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    hours JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.business_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    body TEXT,
    verified_purchase BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (business_id, author_id)
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    product_kind VARCHAR(12) CHECK (product_kind IN ('physical', 'digital', 'service')) NOT NULL,
    price_minor INTEGER CHECK (price_minor > 0) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    inventory_count INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TYPE public.order_status AS ENUM ('pending_payment', 'paid', 'fulfilled', 'cancelled', 'refunded');

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status public.order_status DEFAULT 'pending_payment' NOT NULL,
    subtotal_minor INTEGER NOT NULL,
    platform_fee_minor INTEGER NOT NULL,
    total_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER CHECK (quantity > 0) NOT NULL,
    unit_price_minor INTEGER NOT NULL,
    line_total_minor INTEGER NOT NULL
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_kind VARCHAR(20) CHECK (event_kind IN ('in_person', 'livestream', 'hybrid')) NOT NULL,
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    city_id UUID REFERENCES public.cities(id),
    venue TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT false NOT NULL,
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.event_attendees (
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rsvp_status VARCHAR(12) CHECK (rsvp_status IN ('going', 'interested', 'cancelled')) DEFAULT 'going' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (event_id, profile_id)
);

CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    holder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tier VARCHAR(40) NOT NULL,
    price_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    qr_secret TEXT NOT NULL,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_businesses_country ON public.businesses(country_iso);
CREATE INDEX idx_business_locations_business ON public.business_locations(business_id);
CREATE INDEX idx_business_reviews_business ON public.business_reviews(business_id, created_at DESC);
CREATE INDEX idx_products_seller ON public.products(seller_id, is_active);
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_events_starts ON public.events(starts_at);
CREATE INDEX idx_events_country ON public.events(country_iso, starts_at);
CREATE INDEX idx_event_attendees_profile ON public.event_attendees(profile_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_holder ON public.tickets(holder_id);

-- Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owner creates business" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates business" ON public.businesses
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Public read business locations" ON public.business_locations FOR SELECT USING (true);

CREATE POLICY "Public read business reviews" ON public.business_reviews FOR SELECT USING (true);
CREATE POLICY "Author creates review" ON public.business_reviews
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author updates own review" ON public.business_reviews
    FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Author deletes own review" ON public.business_reviews
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Public read active products" ON public.products
    FOR SELECT USING (is_active OR auth.uid() = seller_id);
CREATE POLICY "Seller creates products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Seller updates products" ON public.products
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Buyer reads own orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Seller reads orders containing their products" ON public.orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
    ));
CREATE POLICY "Buyer creates own order" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Order participants read items" ON public.order_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.order_items oi2
            JOIN public.products p ON p.id = oi2.product_id
            WHERE oi2.order_id = o.id AND p.seller_id = auth.uid()
        ))
    ));
CREATE POLICY "Buyer creates order items" ON public.order_items
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()
    ));

CREATE POLICY "Public read published events" ON public.events
    FOR SELECT USING (starts_at > now() OR auth.uid() = host_id);
CREATE POLICY "Hosts create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts update events" ON public.events
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Attendees and hosts read attendance" ON public.event_attendees
    FOR SELECT USING (profile_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()
    ));
CREATE POLICY "Self RSVP" ON public.event_attendees
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Self update RSVP" ON public.event_attendees
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Holder and host read tickets" ON public.tickets
    FOR SELECT USING (holder_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()
    ));
