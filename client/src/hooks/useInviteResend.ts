import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseInviteResendState {
  /** The invite ID currently selected for the modal, or null if closed */
  selectedInviteId: number | null;
  /** Whether the modal is open */
  isModalOpen: boolean;
  /** Counter to trigger refetch when incremented */
  refreshKey: number;
}

export interface UseInviteResendActions {
  /** Open the resend modal for a specific invite */
  openModal: (inviteId: number) => void;
  /** Close the resend modal */
  closeModal: () => void;
  /** Trigger a refetch of the invite context */
  triggerRefresh: () => void;
}

export interface UseInviteResendOptions {
  /** Enable auto-refresh polling while modal is open (default: false) */
  autoRefresh?: boolean;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  refreshInterval?: number;
}

export type UseInviteResendReturn = UseInviteResendState & UseInviteResendActions;

/**
 * Hook to manage the Invite Resend Modal state.
 * Provides open/close actions, tracks the selected invite ID,
 * and supports auto-refresh for detecting backend state changes (FR-008).
 */
export const useInviteResend = (
  options: UseInviteResendOptions = {}
): UseInviteResendReturn => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [selectedInviteId, setSelectedInviteId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openModal = useCallback((inviteId: number) => {
    setSelectedInviteId(inviteId);
    setRefreshKey(0); // Reset refresh key when opening a new modal
  }, []);

  const closeModal = useCallback(() => {
    setSelectedInviteId(null);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Auto-refresh polling when modal is open
  useEffect(() => {
    if (!autoRefresh || selectedInviteId === null) {
      // Clear interval if auto-refresh is disabled or modal is closed
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, refreshInterval);

    // Cleanup on unmount or when modal closes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, selectedInviteId]);

  return {
    selectedInviteId,
    isModalOpen: selectedInviteId !== null,
    refreshKey,
    openModal,
    closeModal,
    triggerRefresh,
  };
};

export default useInviteResend;
