import { useState } from 'react';

interface UseFormSubmitOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFormSubmit(options: UseFormSubmitOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (endpoint: string, data: Record<string, any>) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (endpoint.includes('/functions/v1/')) {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (anonKey) {
          headers['apikey'] = anonKey;
          // Les anciennes clés (JWT « eyJ… ») vont aussi dans Authorization.
          // Les nouvelles clés publishable (sb_publishable_…) seraient refusées dans cet en-tête.
          if (anonKey.startsWith('eyJ')) {
            headers['Authorization'] = `Bearer ${anonKey}`;
          }
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Une erreur est survenue lors de l\'envoi du formulaire';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Une erreur est survenue lors de l\'envoi du formulaire');
      }

      setSuccess(true);
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Une erreur inconnue est survenue');
      console.error('Form submission error:', error);
      setError(error.message);
      options.onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { submit, isSubmitting, error, success, reset };
}
