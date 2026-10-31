/**
 * Step 4 of onboarding: identity and business documents (RFC platform-v2 §3).
 *
 * Upload only. Once a document is sent, the merchant sees its name, type and size — never its
 * bytes; only Payzeno staff can open one, through the admin API.
 */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { KYC_DOCUMENT_TYPES } from '@payzeno/contracts';
import type { KycDocument, KycDocumentType } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Label } from '@components/ui/Label';
import { Select } from '@components/ui/Select';
import { formatBytes } from '@lib/format';

import { DOCUMENT_TYPE_LABELS } from '../onboarding.copy';
import { KYC_DOCUMENT_MAX_BYTES } from '../onboarding.queries';
import { KYC_ACCEPT } from '../useUploadKycDocument';

const documentColumns: ReadonlyArray<ColumnDef<KycDocument>> = [
  {
    id: 'filename',
    header: 'File',
    cell: (row) => <span>{row.filename}</span>,
    exportValue: (row) => row.filename,
  },
  {
    id: 'type',
    header: 'Type',
    cell: (row) => <span>{DOCUMENT_TYPE_LABELS[row.type]}</span>,
    exportValue: (row) => row.type,
  },
  {
    id: 'size_bytes',
    header: 'Size',
    align: 'end',
    cell: (row) => <span>{formatBytes(row.size_bytes)}</span>,
    exportValue: (row) => String(row.size_bytes),
  },
  {
    id: 'uploaded_at',
    header: 'Uploaded',
    cell: (row) => <DateCell value={row.uploaded_at} />,
    exportValue: (row) => row.uploaded_at,
  },
];

export interface KycDocumentsSectionProps {
  documents: ReadonlyArray<KycDocument>;
  editable: boolean;
  onUpload: (file: File, type: KycDocumentType) => Promise<boolean>;
  isUploading: boolean;
  errorMessage: string | null;
}

export function KycDocumentsSection({
  documents,
  editable,
  onUpload,
  isUploading,
  errorMessage,
}: KycDocumentsSectionProps) {
  const [type, setType] = useState<KycDocumentType>('identity_document');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || isUploading) return;
    const uploaded = await onUpload(file, type);
    if (uploaded) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <DataTable<KycDocument>
        caption="Documents you have uploaded for verification"
        columns={documentColumns}
        rows={documents}
        isLoading={false}
        emptyState={
          <EmptyRows
            title="No documents yet"
            body="Upload a passport or national ID for the account representative to continue."
          />
        }
      />

      {editable ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          aria-label="Upload a document"
        >
          <Select<KycDocumentType>
            id="kyc-document-type"
            label="Document type"
            value={type}
            onValueChange={setType}
            options={KYC_DOCUMENT_TYPES.map((value) => ({
              value,
              label: DOCUMENT_TYPE_LABELS[value],
            }))}
          />

          <Label htmlFor="kyc-document-file">File</Label>
          <p id="kyc-document-file-hint">
            PDF, PNG, JPEG or WebP, up to {formatBytes(KYC_DOCUMENT_MAX_BYTES)}.
          </p>
          <input
            ref={inputRef}
            id="kyc-document-file"
            name="file"
            type="file"
            accept={KYC_ACCEPT}
            aria-describedby={
              errorMessage ? 'kyc-document-file-hint kyc-upload-error' : 'kyc-document-file-hint'
            }
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          {errorMessage ? <InlineError id="kyc-upload-error">{errorMessage}</InlineError> : null}

          <Button type="submit" disabled={!file || isUploading}>
            {isUploading ? 'Uploading…' : 'Upload document'}
          </Button>
        </form>
      ) : null}
    </>
  );
}
