import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Wallet,
  MessageCircle,
  Home,
  Clock,
  CheckCircle2,
  User,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';

import type { Language, Listing } from '../../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface InterestAcceptedEvent {
  requestId: number;
  listingId: number;
  ownerId: number;
  tenantId: number;
  conversationId: number;
  status: string;
}

interface PropertyDetailsDrawerProps {
  item: Listing | null;
  lang: Language;

  title: string;
  contactLabel: string;
  locationLabel: string;
  ownerLabel: string;
  currentUserId?: number;
  yourListingLabel: string;
  priceLabel: string;
  perMonthLabel: string;
  closeLabel: string;

  onClose: () => void;
  onContact: (item: Listing, conversationId?: number) => void;
}

export const PropertyDetailsDrawer: React.FC<PropertyDetailsDrawerProps> = ({
  item,
  lang,
  title,
  locationLabel,
  ownerLabel,
  currentUserId,
  yourListingLabel,
  priceLabel,
  perMonthLabel,
  contactLabel,
  closeLabel,
  onClose,
  onContact,
}) => {
  const isMine = item !== null && item.ownerId === currentUserId;

  const [requestStatus, setRequestStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!item || isMine) {
      setRequestStatus('NONE');
      setConversationId(undefined);
      return;
    }

    let cancelled = false;

    const fetchInterestStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/interest-requests/status/${item.id}`, {
          credentials: 'include',
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data) {
            setRequestStatus(data.status ?? 'NONE');
            setConversationId(
              typeof data.conversationId === 'number' ? Number(data.conversationId) : undefined,
            );
          } else {
            setRequestStatus('NONE');
            setConversationId(undefined);
          }
        }
      } catch (err) {
        console.error('Failed to fetch interest status', err);
      }
    };

    fetchInterestStatus();

    return () => {
      cancelled = true;
    };
  }, [item, isMine]);

  useEffect(() => {
    if (!item || isMine || currentUserId == null) return;

    const wsUrl = (import.meta.env.VITE_WS_URL || API_URL || '').replace(/\/api\/?$/, '');
    const socket: Socket = io(wsUrl, {
      withCredentials: true,
    });

    const handleInterestAccepted = (payload: InterestAcceptedEvent) => {
      if (Number(payload.listingId) !== Number(item.id)) return;
      if (Number(payload.tenantId) !== Number(currentUserId)) return;

      setRequestStatus('ACCEPTED');
      if (typeof payload.conversationId === 'number' && Number(payload.conversationId) > 0) {
        setConversationId(Number(payload.conversationId));
      }
    };

    socket.on('interestRequestAccepted', handleInterestAccepted);

    return () => {
      socket.off('interestRequestAccepted', handleInterestAccepted);
      socket.disconnect();
    };
  }, [item, isMine, currentUserId]);

  if (!item) {
    return null;
  }

  const propertyTitle = item.title[lang];
  const city = item.city[lang];

  const handleContactClick = async () => {
    if (requestStatus === 'ACCEPTED') {
      const targetConversationId = conversationId;
      onClose();
      onContact(item, targetConversationId);
      return;
    }

    if (requestStatus === 'PENDING') {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat/interest-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: item.id,
        }),
      });

      if (res.ok) {
        const created = await res.json().catch(() => null);
        setRequestStatus(created?.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING');
        if (typeof created?.conversationId === 'number') {
          setConversationId(Number(created.conversationId));
        }
      }
    } catch (err) {
      console.error('Failed to send interest request', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto cursor-default"
      />

      {/* Drawer */}
      <aside
        className="
          absolute top-0 bottom-0 start-0
          w-full max-w-[430px]
          bg-white shadow-2xl
          overflow-y-auto
          pointer-events-auto
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-(--color-accent)">
              iRent
            </p>

            <h2 className="text-lg font-black text-(--color-primary) truncate">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
            aria-label={closeLabel}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Image */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={propertyTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Price */}
          <div className="absolute bottom-4 start-4 bg-white rounded-xl px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-(--color-accent)" />

              <span className="text-base font-black text-(--color-primary)">
                {item.price}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-xl font-black text-(--color-primary)">
            {propertyTitle}
          </h3>

          {/* Location */}
          {city && (
            <div className="flex items-start gap-3 mt-4">
              <div className="w-10 h-10 rounded-xl bg-(--color-accent-soft) flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-(--color-accent)" />
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400">
                  {locationLabel}
                </p>

                <p className="text-xs font-semibold text-gray-500">
                  {city}
                </p>
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="mt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <User className="w-4 h-4 text-(--color-accent)" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400">{ownerLabel}</p>
              <p className="text-xs font-semibold text-gray-700">{item.ownerName}</p>
            </div>
          </div>

          {/* Price information */}
          <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Wallet className="w-4 h-4 text-(--color-accent)" />
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400">
                  {priceLabel}
                </p>

                <p className="text-base font-black text-(--color-primary)">
                  {item.price} {perMonthLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Contact / Request Button (hidden on the user's own listing) */}
          {isMine ? (
            <p className="w-full mt-6 py-3.5 px-5 rounded-xl text-sm font-black text-center bg-(--color-accent-soft) text-(--color-accent)">
              {yourListingLabel}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleContactClick}
              disabled={loading || requestStatus === 'PENDING'}
              className={`w-full mt-6 py-3.5 px-5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                requestStatus === 'PENDING'
                  ? 'bg-amber-500 text-white cursor-not-allowed'
                  : requestStatus === 'ACCEPTED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-(--color-accent) hover:bg-(--color-accent-dark) text-white'
              }`}
            >
              {requestStatus === 'PENDING' ? (
                <>
                  <Clock className="w-4 h-4 animate-pulse" />
                  Pending request to the owner
                </>
              ) : requestStatus === 'ACCEPTED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Chat Unlocked - Open Chat
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  {contactLabel}
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};