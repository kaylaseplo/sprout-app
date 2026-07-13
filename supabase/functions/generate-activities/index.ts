import { createClient } from 'jsr:@supabase/supabase-js@2'

const SYSTEM_PROMPT = `You are an experienced early childhood educator who designs age-appropriate activities for nursery and daycare classrooms. Given the classroom's age group and the teacher's constraints, propose exactly 3 distinct activities.

Respond with ONLY valid JSON (no markdown, no commentary) matching this shape:
{"activities": [{"title": string, "description": string, "materials": string[], "duration_minutes": number}, ...]}

Each activity must be developmentally appropriate for the given age group, practical to run with the given supplies and time, and must NOT repeat any of the recently used activity titles provided. Vary the 3 activities from each other.`

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

    const {
      ageGroup,
      energyLevel,
      timeAvailable,
      setting,
      supplies,
      theme,
      recentTitles,
    } = await req.json()

    if (!ageGroup || !energyLevel || !timeAvailable || !setting) {
      return new Response(
        JSON.stringify({ error: 'ageGroup, energyLevel, timeAvailable, and setting are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userPrompt = `Classroom age group: ${ageGroup}
Energy level: ${energyLevel}
Time available: ${timeAvailable}
Setting: ${setting}
Supplies on hand: ${supplies || 'not specified'}
This week's theme/agenda: ${theme || 'none'}
Recently used activities (do not repeat these): ${
      Array.isArray(recentTitles) && recentTitles.length > 0 ? recentTitles.join(', ') : 'none'
    }

Propose exactly 3 activities as JSON.`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1536,
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
    const rawText = result.content?.[0]?.text ?? '{}'

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse activities response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ activities: parsed.activities ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
