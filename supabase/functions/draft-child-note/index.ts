import { createClient } from 'jsr:@supabase/supabase-js@2'

const SYSTEM_PROMPT = `You are helping a nursery/daycare teacher turn a conversation into a short observational note for a specific child's record.

Rules, no exceptions:
- Stay strictly observational, never diagnostic. Describe behavior you were told about ("got frustrated during transitions and hit a peer," "settled after a few minutes with a favorite toy"). Never label the child with a condition, disorder, developmental delay, or any clinical judgment, even if the conversation seems to point that way.
- Capture the important points: what was observed, and any strategies or next steps that were discussed.
- Keep it concise — a short paragraph (2-4 sentences) is usually enough. This is a working note for other teachers, not a report.
- Write in plain, warm, factual language. Do not add caveats about being an AI or that this is a draft — just write the note itself.
- If the conversation includes anything suggesting a child-safety concern (possible abuse, neglect, injury), note the observed facts plainly and do not soften or omit them, but still do not diagnose or speculate about cause.

Output ONLY the note text. No preamble, no headings, no quotes around it.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { childId, messages } = await req.json()

    if (!childId || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'childId and a non-empty messages array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RLS-scoped to the caller's own JWT: returns nothing if this user
    // isn't a member of the child's classroom.
    const { data: child } = await supabase
      .from('children')
      .select('first_name')
      .eq('id', childId)
      .single()

    if (!child) {
      return new Response(JSON.stringify({ error: 'Child not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const transcript = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Teacher' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const userPrompt = `This conversation is about ${child.first_name}. Draft the note now based only on this transcript:\n\n${transcript}`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      return new Response(JSON.stringify({ error: `Claude API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await anthropicResponse.json()
    const draft = result.content?.[0]?.text?.trim() ?? ''

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
