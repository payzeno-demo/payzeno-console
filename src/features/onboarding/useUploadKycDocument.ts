/**
 * `useUploadKycDocument()` — `POST /v1/onboarding/documents` (RFC platform-v2 §3).
 *
 * File → base64 → JSON. The 600 KB cap is checked here before the read, because a 4 MB phone
 * photo base64-encoded is a 5.5 MB request the api will refuse after the merchant has waited
 * for it to upload. The bytes are passed straight through; nothing here stores or logs them.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { KycDocumentType } from '@payzeno/contracts';

import { ConsoleApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { readFileAsBase64 } from '@lib/file';
import { formatBytes } from '@lib/format';

import { KYC_DOCUMENT_MAX_BYTES, uploadKycDocumentMutation } from './onboarding.queries';

export interface UseUploadKycDocumentResult {
  upload: (file: File, type: KycDocumentType) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | null;
}

/** Accepted formats. The api checks the bytes too; this is the picker's filter. */
export const KYC_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp';

export function useUploadKycDocument(): UseUploadKycDocumentResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const mutation = useMutation({
    ...uploadKycDocumentMutation(endpoints),
    onSuccess: async (document) => {
      toast.success(`${document.filename} uploaded.`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.all });
    },
  });
  const { mutateAsync } = mutation;

  const upload = useCallback(
    async (file: File, type: KycDocumentType): Promise<boolean> => {
      setErrorMessage(null);

      if (file.size > KYC_DOCUMENT_MAX_BYTES) {
        setErrorMessage(
          `${file.name} is ${formatBytes(file.size)}. Documents must be ${formatBytes(KYC_DOCUMENT_MAX_BYTES)} or smaller — try a PDF or a smaller photo.`,
        );
        return false;
      }

      try {
        setIsReading(true);
        const content = await readFileAsBase64(file);
        setIsReading(false);
        await mutateAsync({
          type,
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          content_base64: content,
        });
        return true;
      } catch (error: unknown) {
        setIsReading(false);
        setErrorMessage(
          error instanceof ConsoleApiError
            ? error.message
            : `${file.name} could not be uploaded. Try again in a moment.`,
        );
        return false;
      }
    },
    [mutateAsync],
  );

  return { upload, isPending: isReading || mutation.isPending, errorMessage };
}
