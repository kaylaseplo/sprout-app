import { createClient } from 'jsr:@supabase/supabase-js@2'

const SYSTEM_PROMPT = `You are helping a nursery/daycare teacher write a warm, brief caption for a photo update that will be shared with families. Write exactly one or two sentences. Be warm, specific to what's happening in the photo, and mention the tagged children by name if any are given. Do not invent details you can't see in the photo. Never attempt to identify children by facial appearance — only use the names you are explicitly given.`

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

    const { imageBase64, mediaType, childrenNames } = await req.json()

    if (!imageBase64 || !mediaType) {
      return new Response(JSON.stringify({ error: 'imageBase64 and mediaType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const names = Array.isArray(childrenNames) ? childrenNames.filter(Boolean) : []
    const namesText =
      names.length > 0 ? `Children tagged in this photo: ${names.join(', ')}.` : 'No children were tagged in this photo.'

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
              { type: 'text', text: `${namesText}\n\nWrite the caption now.` },
            ],
          },
        ],
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
    const caption = result.content?.[0]?.text?.trim() ?? ''

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
