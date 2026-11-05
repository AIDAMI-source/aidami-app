import type { CommunityPost, CommunityReply } from '../../types/models';
import { getDatabase } from '../database';
import { enqueueSync } from '../syncQueue';
import { newId, nowIso } from '../utils';

export type CreateCommunityPostInput = {
  author_user_id: string;
  body: string;
  id?: string;
};

export type CreateCommunityReplyInput = {
  post_id: string;
  author_user_id: string;
  body: string;
  id?: string;
};

export type CommunityPostWithMeta = CommunityPost & {
  author_full_name: string | null;
  reply_count: number;
};

export type CommunityReplyWithAuthor = CommunityReply & {
  author_full_name: string | null;
};

export async function listCommunityPosts(
  limit = 50,
): Promise<CommunityPostWithMeta[]> {
  const db = await getDatabase();
  return db.getAllAsync<CommunityPostWithMeta>(
    `SELECT
       p.*,
       u.full_name AS author_full_name,
       (
         SELECT COUNT(*) FROM community_replies r
         WHERE r.post_id = p.id AND r.deleted_at IS NULL
       ) AS reply_count
     FROM community_posts p
     LEFT JOIN users u ON u.id = p.author_user_id
     WHERE p.deleted_at IS NULL
     ORDER BY p.created_at DESC
     LIMIT ?`,
    limit,
  );
}

export async function getCommunityPost(
  id: string,
): Promise<CommunityPost | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<CommunityPost>(
      `SELECT * FROM community_posts WHERE id = ? AND deleted_at IS NULL`,
      id,
    )) ?? null
  );
}

export async function listRepliesForPost(
  postId: string,
): Promise<CommunityReplyWithAuthor[]> {
  const db = await getDatabase();
  return db.getAllAsync<CommunityReplyWithAuthor>(
    `SELECT r.*, u.full_name AS author_full_name
     FROM community_replies r
     LEFT JOIN users u ON u.id = r.author_user_id
     WHERE r.post_id = ? AND r.deleted_at IS NULL
     ORDER BY r.created_at ASC`,
    postId,
  );
}

export async function createCommunityPost(
  input: CreateCommunityPostInput,
): Promise<CommunityPost> {
  const body = input.body.trim();
  if (!body) {
    throw new Error('Le message ne peut pas être vide');
  }

  const db = await getDatabase();
  const now = nowIso();
  const post: CommunityPost = {
    id: input.id ?? newId(),
    author_user_id: input.author_user_id,
    body,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO community_posts (
        id, author_user_id, body, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      post.id,
      post.author_user_id,
      post.body,
      post.created_at,
      post.updated_at,
      post.deleted_at,
    );
    await enqueueSync(db, 'community_posts', post.id, 'CREATE', post);
  });

  return post;
}

export async function createCommunityReply(
  input: CreateCommunityReplyInput,
): Promise<CommunityReply> {
  const body = input.body.trim();
  if (!body) {
    throw new Error('La réponse ne peut pas être vide');
  }

  const post = await getCommunityPost(input.post_id);
  if (!post) {
    throw new Error('Publication introuvable');
  }

  const db = await getDatabase();
  const now = nowIso();
  const reply: CommunityReply = {
    id: input.id ?? newId(),
    post_id: input.post_id,
    author_user_id: input.author_user_id,
    body,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO community_replies (
        id, post_id, author_user_id, body, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      reply.id,
      reply.post_id,
      reply.author_user_id,
      reply.body,
      reply.created_at,
      reply.updated_at,
      reply.deleted_at,
    );
    await enqueueSync(db, 'community_replies', reply.id, 'CREATE', reply);
  });

  return reply;
}

export async function countCommunityPosts(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM community_posts WHERE deleted_at IS NULL`,
  );
  return row?.count ?? 0;
}
