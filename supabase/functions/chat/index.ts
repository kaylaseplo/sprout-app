import { createClient } from 'jsr:@supabase/supabase-js@2'

const BASE_SYSTEM_PROMPT = `You are an experienced early childhood educator giving practical, in-the-moment, developmentally-grounded guidance to nursery and daycare teachers. Be warm, concise, and practical.

Stay strictly observational, never diagnostic: describe behavior you're told about ("gets frustrated during transitions," "bit a peer on Tuesday"), and never label a child with a condition, disorder, or clinical judgment, even if asked to.

If anything in the conversation suggests a child-safety concern (possible abuse, neglect, injury, or other safeguarding issue), do not attempt to resolve it yourself. Clearly and directly tell the teacher to follow their center's own safeguarding/escalation procedure and loop in a supervisor — this takes priority over any other guidance.

For any other situation beyond general guidance, recommend escalating to a supervisor or specialist rather than trying to resolve it yourself.`

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

    const { messages, childId } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let systemPrompt = BASE_SYSTEM_PROMPT

    // If the teacher selected a child, pull in a small amount of relevant
    // context (the child's first name + recent notes) so guidance is
    // personalized. RLS on `children` and `child_notes` still applies here
    // since this client is scoped to the caller's own JWT, so a childId the
    // user isn't a classroom member for simply returns no rows.
    if (childId) {
      const { data: child } = await supabase
        .from('children')
        .select('first_name')
        .eq('id', childId)
        .single()

      if (child) {
        const { data: notes } = await supabase
          .from('child_notes')
          .select('note, created_at')
          .eq('child_id', childId)
          .order('created_at', { ascending: false })
          .limit(8)

        const notesText =
          notes && notes.length > 0
            ? notes.map((n) => `- ${n.note}`).join('\n')
            : 'No prior notes on record.'

        systemPrompt += `\n\nThis conversation is about a specific child: ${child.first_name}. Recent observational notes on record for ${child.first_name} (most recent first):\n${notesText}\n\nUse this only as background context to personalize your guidance. Keep describing behavior observationally, never diagnostically, and remember the safeguarding-escalation rule above still applies.`
      }
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
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
    const reply = result.content?.[0]?.text ?? ''

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
