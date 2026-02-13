CREATE TABLE compression_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_filename TEXT NOT NULL,
    source_format TEXT NOT NULL,
    original_size_bytes INTEGER NOT NULL,
    target_size_bytes INTEGER NOT NULL,
    compressed_size_bytes INTEGER,
    status TEXT NOT NULL DEFAULT 'processing',
    error_message TEXT,
    original_storage_path TEXT,
    compressed_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
