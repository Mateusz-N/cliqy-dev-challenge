import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClassifyRequest, ClassifyResponse } from '@/types'

// Model i limit tokenów są zablokowane — nie zmieniaj tych stałych.
const MODEL = 'gpt-4o-mini' as const
const MAX_TOKENS = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// mockowanie odpowiedzi modelu podczas developmentu, by nie zużywać tokenów i mieć stabilne dane do testów
const IS_MOCK = process.env.MOCK_API === 'true'
const mockResponse = (body: ClassifyRequest): ClassifyResponse => ({
  category:
    body.message.includes('zwrot')
      ? 'reklamacja'
      : body.message.includes('zamów')
      ? 'zamówienie'
      : body.message.includes('spam')
      ? 'spam'
      : 'pytanie',

  priority:
    body.message.includes('zwrot') ? 'high' : 'medium',

  draft_reply:
    body.message.includes('zwrot')
      ? 'Dziękujemy za wiadomość. Przykro nam z powodu problemu z zamówieniem. Zaraz pomożemy w rozwiązaniu sprawy.'
      : 'Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.',

  confidence: 0.85
})

// ────────────────────────────────────────────────────────────
// POST /api/classify
//
// Wejście (body JSON):
//   { message: string, company: string }
//
// Wyjście (JSON):
//   {
//     category:    "zamówienie" | "pytanie" | "reklamacja" | "spam"
//     priority:    "high" | "medium" | "low"
//     draft_reply: string  — gotowy szkic odpowiedzi po polsku
//     confidence:  number  — 0–1, pewność klasyfikacji
//   }
//
// TODO: Zaimplementuj ten endpoint.
//
// Wskazówki:
//   - Wywołaj openai.chat.completions.create() używając stałych MODEL i MAX_TOKENS
//   - Poproś model o odpowiedź w formacie JSON (response_format lub system prompt)
//   - draft_reply powinien być w tonie pasującym do firmy i kategorii
//   - Zwróć 400 gdy message lub company jest pusty
// ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  try {
    const body: ClassifyRequest = await req.json()

    // TODO: Walidacja wejścia
    // if (!body.message || !body.company) { ... }

    // TODO: Wywołaj OpenAI API używając MODEL i MAX_TOKENS
    // const completion = await openai.chat.completions.create({
    //   model: MODEL,
    //   max_tokens: MAX_TOKENS,
    //   ...
    // })

    // TODO: Sparsuj odpowiedź i zwróć ClassifyResponse

    // 1. Walidacja wejścia
    if(!body?.message?.trim() || !body?.company?.trim()) {
      return NextResponse.json(
        { error: 'Message and company are required' },
        { status: 400 }
      )
    }

    // 2. Prompt (kluczowa część)
    let content: string | null
    try {
      if(IS_MOCK) {
        content = JSON.stringify(mockResponse(body))
      }
      else {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content: `
                Jesteś systemem klasyfikacji wiadomości dla firmy.

                Zwróć WYŁĄCZNIE poprawny JSON bez żadnego dodatkowego tekstu.

                Kategorie:
                - zamówienie
                - pytanie
                - reklamacja
                - spam

                Priorytet:
                - high (reklamacje, pilne sprawy klientów)
                - medium (zamówienia, pytania o produkt/usługę)
                - low (spam, ogólne wiadomości)

                Zasady:
                - draft_reply musi być po polsku
                - ton odpowiedzi dopasuj do firmy: ${body.company}
                - confidence to liczba od 0 do 1
                - nie dodawaj żadnych komentarzy, tylko JSON
                `.trim()
            },
            {
              role: 'user',
              content: body.message
            }
          ],

          // jeśli SDK wspiera JSON mode — warto włączyć:
          response_format: { type: 'json_object' }
        })
      content = completion.choices[0]?.message?.content
      }
    }
    catch(err) {
      console.error('OPENAI ERROR:', err)
      return NextResponse.json(
        { error: 'OpenAI failed' },
        { status: 500 }
      )
    }

    if(!content) {
      return NextResponse.json(
        { error: 'Empty response from model' },
        { status: 500 }
      )
    }

    // 3. Parsowanie z zabezpieczeniem
    let parsed: ClassifyResponse

    try {
      parsed = JSON.parse(content)
    }
    catch {
      return NextResponse.json(
        { error: 'Invalid JSON from model' },
        { status: 500 }
      )
    }

    // 4. Minimalna walidacja odpowiedzi
    if(!parsed.category || !parsed.priority || typeof parsed.confidence !== 'number') {
      return NextResponse.json(
        { error: 'Malformed model response' },
        { status: 500 }
      )
    }
    // Ograniczenie pewności do przedziału [0-1]
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence))

    return NextResponse.json(parsed)
  }
  catch(err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
