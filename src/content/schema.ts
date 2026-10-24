import { z } from 'zod';

export const CARD_ID_PATTERN = /^u\d{2}-[a-z0-9]+-\d{3}$/;
export const UNIT_ID_PATTERN = /^u\d{2}$/;

const cardIdSchema = z.string().regex(CARD_ID_PATTERN, 'id 형식은 uNN-주제-NNN 이어야 합니다 (예: u03-substr-001)');
const unitIdFieldSchema = z.string().regex(UNIT_ID_PATTERN, 'unitId 형식은 uNN 이어야 합니다 (예: u03)');

const cardTagSchema = z.enum(['trap', 'mssql', 'oracle']);

const cardBase = z.object({
  id: cardIdSchema,
  unitId: unitIdFieldSchema,
  front: z.string().min(1, 'front는 비어 있을 수 없습니다'),
  explanation: z.string().optional(),
  tags: z.array(cardTagSchema).default([]),
  verified: z.boolean(),
});

const withRequiredBack = cardBase.extend({
  back: z.string().min(1, 'back는 비어 있을 수 없습니다'),
});

const oxCard = cardBase.extend({
  type: z.literal('ox'),
  back: z.string().optional(),
  answer: z.enum(['O', 'X']),
});

const choiceCard = cardBase.extend({
  type: z.literal('choice'),
  back: z.string().optional(),
  choices: z.array(z.string().min(1)).length(4, 'choices는 정확히 4개여야 합니다'),
  answer: z.enum(['1', '2', '3', '4']),
});

const orderCard = cardBase.extend({
  type: z.literal('order'),
  back: z.string().optional(),
  items: z.array(z.string().min(1)).min(2, 'items는 2개 이상이어야 합니다'),
  answer: z.array(z.number().int().nonnegative()),
});

// discriminatedUnion members must stay plain ZodObjects (no .refine()) for
// zod to read the discriminator key off their shape, so the order-specific
// cross-field check is applied as a superRefine on the composed union.
export const cardSchema = z
  .discriminatedUnion('type', [
    withRequiredBack.extend({ type: z.literal('definition') }),
    withRequiredBack.extend({ type: z.literal('predict') }),
    withRequiredBack.extend({ type: z.literal('cloze') }),
    withRequiredBack.extend({ type: z.literal('dbms') }),
    oxCard,
    choiceCard,
    orderCard,
  ])
  .superRefine((card, ctx) => {
    if (card.type !== 'order') return;
    const valid =
      card.answer.length === card.items.length &&
      new Set(card.answer).size === card.items.length &&
      card.answer.every((i) => i < card.items.length);
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'order의 answer는 items와 같은 길이의 0-based 인덱스 순열이어야 합니다',
        path: ['answer'],
      });
    }
  });

export type Card = z.infer<typeof cardSchema>;
export type CardType = Card['type'];

export const unitWeightSchema = z.enum(['high', 'mid', 'low']);

export const unitSchema = z.object({
  id: unitIdFieldSchema,
  no: z.number().int().positive(),
  title: z.string().min(1),
  weight: unitWeightSchema,
  expectedCardCount: z.number().int().nonnegative(),
  summaryFile: z.string().min(1),
});

export type Unit = z.infer<typeof unitSchema>;

export const unitsFileSchema = z.array(unitSchema);
export const cardsFileSchema = z.array(cardSchema);
