// Cloudflare Pages Function — POST /api/contact
//
// Frontend/backend contract (see assets/js/main.js -> initContactForm):
//   POST { name, email, subject, message, company }
//   -> 200 { ok: true }
//   -> 422 { ok: false, errors: { field: "message" } }   client-fixable
//   -> 4xx/5xx { ok: false, error: "message" }            relay/config failure
//
// `company` is a honeypot field, hidden in CSS and never populated by real
// users. If it arrives non-empty we pretend to succeed rather than telling
// the bot what tripped it.
//
// Email relay: Resend (https://resend.com). One secret to configure:
//   wrangler pages secret put RESEND_API_KEY
// Optional, defaults to jaguar999paw@gmail.com:
//   wrangler pages secret put CONTACT_TO_EMAIL
//
// Until RESEND_API_KEY is set, this endpoint validates and rejects with a
// clear 503 rather than silently discarding messages — see the check below.

const TO_EMAIL_DEFAULT = 'jaguar999paw@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign(
      { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      extraHeaders || {}
    ),
  });
}

function corsHeaders(origin, allowedOrigin) {
  if (origin && origin === allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
  }
  return {};
}

function validate(body) {
  const errors = {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2 || name.length > 80) {
    errors.name = 'Name must be 2\u201380 characters.';
  }
  if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (subject.length < 3 || subject.length > 120) {
    errors.subject = 'Subject must be 3\u2013120 characters.';
  }
  if (message.length < 20 || message.length > 4000) {
    errors.message = 'Message must be 20\u20134000 characters.';
  }

  return { errors, clean: { name, email, subject, message } };
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin');
  const allowedOrigin = new URL(context.request.url).origin;
  return new Response(null, { status: 204, headers: corsHeaders(origin, allowedOrigin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const allowedOrigin = new URL(request.url).origin;
  const cors = corsHeaders(origin, allowedOrigin);

  // Same-origin enforcement (belt-and-braces alongside the CORS headers
  // above): reject cross-site POSTs outright rather than merely omitting
  // the ACAO header, since a same-origin form should never see a foreign
  // Origin header in the first place.
  if (origin && origin !== allowedOrigin) {
    return jsonResponse({ ok: false, error: 'Origin not allowed.' }, 403, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400, cors);
  }

  // Honeypot check — real users never fill this hidden field.
  if (body && body.company) {
    return jsonResponse({ ok: true }, 200, cors);
  }

  const { errors, clean } = validate(body || {});
  if (Object.keys(errors).length > 0) {
    return jsonResponse({ ok: false, errors }, 422, cors);
  }

  if (!env.RESEND_API_KEY) {
    console.error(
      'RESEND_API_KEY is not set — run: wrangler pages secret put RESEND_API_KEY'
    );
    return jsonResponse(
      { ok: false, error: 'Contact form is not configured yet — please email me directly.' },
      503,
      cors
    );
  }

  const toEmail = env.CONTACT_TO_EMAIL || TO_EMAIL_DEFAULT;

  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Swap for a domain you've verified in Resend once you have one;
        // onboarding@resend.dev works out of the box for testing.
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: [toEmail],
        reply_to: clean.email,
        subject: `[Portfolio] ${clean.subject}`,
        text: `From: ${clean.name} <${clean.email}>\n\n${clean.message}`,
      }),
    });

    if (!resendResp.ok) {
      const detail = await resendResp.text();
      console.error('Resend API error', resendResp.status, detail);
      return jsonResponse(
        { ok: false, error: 'Message could not be sent. Please try again later.' },
        502,
        cors
      );
    }
  } catch (err) {
    console.error('Contact relay failed', err);
    return jsonResponse(
      { ok: false, error: 'Message could not be sent. Please try again later.' },
      502,
      cors
    );
  }

  return jsonResponse({ ok: true }, 200, cors);
}
