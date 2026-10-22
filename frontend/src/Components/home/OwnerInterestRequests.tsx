import React, { useEffect, useState } from 'react';
import { User, CheckCircle, Home } from 'lucide-react';

interface InterestRequest {
  id: number;
  tenantId: number;
  listingId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface OwnerInterestRequestsProps {
  onAcceptSuccess?: (conversationId?: number) => void;
}

export const OwnerInterestRequests: React.FC<OwnerInterestRequestsProps> = ({
  onAcceptSuccess,
}) => {
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/chat/interest-requests/owner', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        setError('Failed to load interest requests');
      }
    } catch (err) {
      console.error('Error fetching owner requests:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/chat/interest-requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: 'ACCEPTED' } : req
          )
        );
        if (onAcceptSuccess) {
          onAcceptSuccess(data.conversation?.id);
        }
      }
    } catch (err) {
      console.error('Failed to accept interest request:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--color-muted)]">
        Loading requests...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] my-6">
      <h2 className="text-xl font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <Home className="w-5 h-5 text-[var(--color-accent)]" />
        Interested Applicants
      </h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {requests.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] py-4 text-center">
          No interest requests received yet.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--color-accent-dark)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Applicant ID: #{req.tenantId}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Listing ID: #{req.listingId} • {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                {req.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id)}
                    className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white text-xs font-bold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept & Open Chat
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accepted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
