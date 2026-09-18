'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Calendar,
  Radio,
  Store,
  Users,
  User,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Bot,
  UserCheck,
  Truck,
  Ship,
  Plane,
} from 'lucide-react';
import type {
  MessageKind,
  MessageMetadata,
  ProductContextPayload,
  OrderContextPayload,
  ShipmentTrackingContextPayload,
  EventContextPayload,
  LivestreamContextPayload,
  StoreContextPayload,
  ProfileContextPayload,
  CommunityContextPayload,
  AiResponsePayload,
} from '@caribbean/messaging';
import TukubiImage from '../../ui/tukubi-image';

interface MessageContextCardProps {
  kind: MessageKind;
  metadata?: MessageMetadata;
  isMine?: boolean;
  onActionClick?: (action: string, payload?: any) => void;
}

export default function MessageContextCard({
  kind,
  metadata,
  isMine = false,
  onActionClick,
}: MessageContextCardProps) {
  if (!metadata) return null;

  // 1. PRODUCT CONTEXT CARD (Marketplace & Store Items)
  if (kind === 'product' && metadata.product) {
    const product: ProductContextPayload = metadata.product;
    const priceFormatted = `$${(product.priceMinor / 100).toFixed(2)} ${product.currency || 'USD'}`;

    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl hover:border-brand-caribbeanSea/40 transition-all text-left">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
          <span className="flex items-center gap-1.5 text-brand-caribbeanSea">
            <ShoppingBag className="w-3.5 h-3.5" /> Marketplace Listing
          </span>
          {product.isAvailable !== false ? (
            <span className="text-emerald-400 font-bold">In Stock</span>
          ) : (
            <span className="text-rose-400 font-bold">Sold Out</span>
          )}
        </div>

        <div className="flex gap-3 items-center">
          {product.imageUrl ? (
            <TukubiImage
              src={product.imageUrl}
              alt={product.title}
              width={64}
              height={64}
              objectFit="cover"
              className="w-16 h-16 rounded-xl border border-white/10 bg-slate-900 overflow-hidden flex-shrink-0"
              imageClassName="rounded-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-caribbeanSea">
              <ShoppingBag className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-xs font-black text-white truncate">{product.title}</h4>
            <p className="text-xs font-black text-brand-goldenHour">{priceFormatted}</p>
            {product.sellerName && (
              <p className="text-[10px] text-slate-400 truncate">Seller: {product.sellerName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <Link
            href={product.listingUrl || `/marketplace`}
            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 text-xs font-black flex items-center justify-center gap-1 hover:opacity-95 transition-opacity"
          >
            <span>View Product</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. ORDER CONTEXT CARD (Commerce & Fulfillment)
  if (kind === 'order' && metadata.order) {
    const order: OrderContextPayload = metadata.order;
    const totalFormatted = `$${(order.totalMinor / 100).toFixed(2)} ${order.currency || 'USD'}`;

    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
          <span className="flex items-center gap-1.5 text-brand-sunriseCoral">
            <Package className="w-3.5 h-3.5" /> Order #{order.orderNumber}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral text-[10px] font-black uppercase">
            {order.status}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <p className="font-bold text-white truncate">{order.itemsSummary || `${order.itemsCount} items`}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Total: <strong className="text-brand-goldenHour">{totalFormatted}</strong></span>
            <span className="capitalize">{(order.fulfillmentType || 'shipping').replace('_', ' ')}</span>
          </div>
        </div>

        <Link
          href={order.orderUrl || `/account/orders`}
          className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
        >
          <span>Track Order Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 2.5. SHIPMENT TRACKING CONTEXT CARD (Inter-Island Logistics)
  if (kind === 'shipment_tracking' && metadata.shipment) {
    const shipment = metadata.shipment;
    const isMaritime = shipment.transitMode === 'maritime_freight' || shipment.transitMode === 'inter_island_ferry';
    const isAir = shipment.transitMode === 'air_cargo';

    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left hover:border-brand-caribbeanSea/40 transition-all">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
          <span className="flex items-center gap-1.5 text-brand-caribbeanSea">
            {isAir ? <Plane className="w-3.5 h-3.5" /> : isMaritime ? <Ship className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            Inter-Island Logistics
          </span>
          <span className="px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea text-[10px] font-black uppercase">
            {shipment.statusLabel || shipment.status}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">
              {shipment.originIsland} ➔ {shipment.destinationIsland}
            </span>
            <span className="text-[11px] font-mono text-slate-400">#{shipment.trackingNumber}</span>
          </div>
          <p className="text-[11px] text-slate-300 flex items-center gap-1">
            <span>Carrier: <strong>{shipment.carrierName}</strong></span>
          </p>
          {shipment.latestLocation && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{shipment.latestLocation}</span>
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, shipment.progressPercent || 20))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Estimated Delivery:</span>
            <span className="text-white font-medium">
              {new Date(shipment.estimatedDeliveryAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Link
          href={shipment.trackingUrl || `/account/orders`}
          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-twilight text-white text-xs font-bold flex items-center justify-center gap-1 hover:opacity-95 transition-all"
        >
          <span>Track Live Shipment</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 3. EVENT CONTEXT CARD

  if (kind === 'event' && metadata.event) {
    const event: EventContextPayload = metadata.event;
    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-brand-goldenHour">
          <Calendar className="w-3.5 h-3.5" /> Caribbean Event
        </div>

        <div className="flex gap-3 items-center">
          {event.coverUrl ? (
            <TukubiImage
              src={event.coverUrl}
              alt={event.title}
              width={64}
              height={64}
              objectFit="cover"
              className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden flex-shrink-0"
              imageClassName="rounded-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-goldenHour">
              <Calendar className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-xs font-black text-white truncate">{event.title}</h4>
            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{event.location} {event.islandCountry ? `• ${event.islandCountry}` : ''}</span>
            </p>
          </div>
        </div>

        <Link
          href={event.eventUrl || `/events`}
          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-brand-goldenHour to-brand-sunriseCoral text-slate-950 text-xs font-black flex items-center justify-center gap-1 hover:opacity-95 transition-opacity"
        >
          <span>RSVP / Get Tickets</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 4. LIVESTREAM CONTEXT CARD
  if (kind === 'livestream' && metadata.livestream) {
    const live: LivestreamContextPayload = metadata.livestream;
    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center justify-between text-[11px] font-black">
          <span className="flex items-center gap-1.5 text-rose-500 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> LIVE STREAM
          </span>
          {live.peakViewers !== undefined && (
            <span className="text-slate-400 text-[10px] font-bold">{live.peakViewers} watching</span>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-black text-white truncate">{live.title}</h4>
          <p className="text-[11px] text-slate-300">Host: {live.hostName}</p>
        </div>

        <Link
          href={live.streamUrl || `/live`}
          className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Join Live Stream</span>
        </Link>
      </div>
    );
  }

  // 5. STORE CONTEXT CARD
  if (kind === 'store' && metadata.store) {
    const store: StoreContextPayload = metadata.store;
    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-brand-caribbeanSea">
          <Store className="w-3.5 h-3.5" /> Caribbean Storefront
        </div>

        <div className="flex gap-3 items-center">
          {store.logoUrl ? (
            <TukubiImage
              src={store.logoUrl}
              alt={store.name}
              width={48}
              height={48}
              objectFit="cover"
              className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden flex-shrink-0"
              imageClassName="rounded-xl"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-caribbeanSea">
              <Store className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white truncate flex items-center gap-1">
              <span>{store.name}</span>
              <ShieldCheck className="w-3 h-3 text-brand-caribbeanSea" />
            </h4>
            <p className="text-[10px] text-slate-400 truncate">{store.category} {store.islandCountry ? `• ${store.islandCountry}` : ''}</p>
          </div>
        </div>

        <Link
          href={store.storeUrl || `/store/${store.storeSlug}`}
          className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
        >
          <span>Visit Store Catalog</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 6. COMMUNITY CONTEXT CARD
  if (kind === 'community' && metadata.community) {
    const comm: CommunityContextPayload = metadata.community;
    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-brand-caribbeanSea">
          <Users className="w-3.5 h-3.5" /> Caribbean Community
        </div>

        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-twilight flex items-center justify-center text-slate-950 font-black">
            <Users className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white truncate">{comm.name}</h4>
            <p className="text-[10px] text-slate-400">{comm.memberCount} Members {comm.islandCountry ? `• ${comm.islandCountry}` : ''}</p>
          </div>
        </div>

        <Link
          href={comm.communityUrl || `/c/${comm.slug}`}
          className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
        >
          <span>Explore Community</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 7. PROFILE CONTEXT CARD
  if (kind === 'profile' && metadata.profile) {
    const prof: ProfileContextPayload = metadata.profile;
    return (
      <div className="rounded-2xl bg-[#140C22] border border-white/15 p-3.5 space-y-3 max-w-sm shadow-xl text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
          <User className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Caribbean Profile
        </div>

        <div className="flex gap-3 items-center">
          {prof.avatarUrl ? (
            <TukubiImage
              src={prof.avatarUrl}
              alt={prof.displayName}
              width={48}
              height={48}
              objectFit="cover"
              className="w-12 h-12 rounded-full border border-white/10 overflow-hidden flex-shrink-0"
              imageClassName="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">
              {prof.displayName.slice(0, 1)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white truncate flex items-center gap-1">
              <span>{prof.displayName}</span>
              {prof.isVerified && <ShieldCheck className="w-3 h-3 text-brand-caribbeanSea" />}
            </h4>
            <p className="text-[10px] text-slate-400 truncate">@{prof.username}</p>
            {prof.bio && <p className="text-[10px] text-slate-300 line-clamp-1">{prof.bio}</p>}
          </div>
        </div>

        <Link
          href={prof.profileUrl || `/profile/${prof.username}`}
          className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 8. AI BUSINESS ASSISTANT CARD (With suggested actions & human handoff)
  if (kind === 'ai_response' && metadata.ai) {
    const ai: AiResponsePayload = metadata.ai;
    return (
      <div className="rounded-2xl bg-gradient-to-b from-[#180E2B] to-[#10081C] border border-brand-caribbeanSea/30 p-3.5 space-y-3 max-w-md shadow-xl text-left">
        <div className="flex items-center justify-between text-[11px] font-black text-brand-caribbeanSea">
          <span className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" /> TUKUBI Business AI
          </span>
          {ai.isHumanEscalated ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Staff Notified
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold">Grounded & Verified</span>
          )}
        </div>

        {ai.suggestedActions && ai.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
            {ai.suggestedActions.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick && onActionClick(btn.action, btn.payload)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-brand-caribbeanSea/20 text-slate-200 hover:text-brand-caribbeanSea text-[11px] font-bold border border-white/10 hover:border-brand-caribbeanSea/30 transition-all cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
