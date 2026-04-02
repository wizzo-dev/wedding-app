import { z } from 'zod'

/**
 * Zod validation middleware factory
 * Usage: preHandler: [validate(schema)]
 */
export const validate = (schema) => async (req, reply) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    })
    req.body   = parsed.body   ?? req.body
    req.params = parsed.params ?? req.params
    req.query  = parsed.query  ?? req.query
  } catch (err) {
    if (err instanceof z.ZodError) {
      reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'נתונים לא תקינים',
        fields: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    } else {
      throw err  // re-throw non-validation errors so Fastify handles them
    }
  }
}

// ── Common Schemas ────────────────────────────────────────────────────────────
export const schemas = {
  register: z.object({
    body: z.object({
      email: z.string().email('אימייל לא תקין').toLowerCase().trim(),
      password: z.string().min(8, 'סיסמה חייבת להיות לפחות 8 תווים'),
      name1: z.string().min(1).max(50).trim(),
      name2: z.string().min(1).max(50).trim(),
      // input type="date" returns "YYYY-MM-DD" — not ISO datetime
      weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לא תקין (YYYY-MM-DD)').optional().nullable()
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email().toLowerCase().trim(),
      password: z.string().min(1)
    })
  }),

  createGuest: z.object({
    body: z.object({
      name: z.string().min(1).max(100).trim(),
      phone: z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().nullable(),
      email: z.string().email().optional().nullable(),
      side: z.enum(['groom', 'bride', 'mutual']).optional(),
      groupName: z.string().max(50).optional().nullable(),
      numPeople: z.number().int().min(1).max(30).default(1),
      notes: z.string().max(500).optional().nullable()
    })
  }),

  updateRsvp: z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
      rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']),
      numPeople: z.number().int().min(0).max(30).optional()
    })
  }),

  pagination: z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
      search: z.string().max(100).optional(),
      filter: z.string().optional()
    })
  })
}
