import { useState, useEffect, useCallback, useRef } from 'react';

import { VerdictStatus, UseVerdictPollingOptions } from '../types';

export function useVerdictPolling({
    code,
    enabled,
    interval = 3000,
    maxAttempts = 40
}: UseVerdictPollingOptions) {
    const [status, setStatus] = useState<VerdictStatus | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const attemptsRef = useRef(attempts);

    // Keep ref in sync
    useEffect(() => {
        attemptsRef.current = attempts;
    }, [attempts]);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/case/${code}/status`);
            if (!res.ok) throw new Error('Failed to check status');
            const data: VerdictStatus = await res.json();
            setStatus(data);
            setError(null);
            return data;
        } catch {
            setError('Failed to check verdict status');
            return null;
        }
    }, [code]);

    useEffect(() => {
        if (!enabled || !code) return;

        let intervalId: NodeJS.Timeout;

        const poll = async () => {
            if (attemptsRef.current >= maxAttempts) {
                clearInterval(intervalId);
                return;
            }

            const result = await checkStatus();
            setAttempts(prev => prev + 1);

            if (result?.status === 'complete') {
                clearInterval(intervalId);
            }
        };

        poll();

        intervalId = setInterval(poll, interval);

        return () => clearInterval(intervalId);
    }, [enabled, code, interval, maxAttempts, checkStatus]);

    return {
        status,
        attempts,
        error,
        isPolling: enabled && status?.status !== 'complete' && attempts < maxAttempts
    };
}
