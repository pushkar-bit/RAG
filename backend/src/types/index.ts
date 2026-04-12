import { z } from 'zod';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    created_at: string;
}

export interface Document {
    id: string;
    workspace_id: string;
    name: string;
    status: 'pending' | 'processing' | 'indexed' | 'error';
    created_at: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    retrieved_chunks?: string[];
    is_grounded?: boolean;
}

export const QueryRequestSchema = z.object({
    query: z.string().min(1).max(1000),
    sessionId: z.string().uuid().optional(),
    topK: z.number().int().min(1).max(10).default(5),
    similarityThreshold: z.number().min(0.5).max(1.0).default(0.7),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
