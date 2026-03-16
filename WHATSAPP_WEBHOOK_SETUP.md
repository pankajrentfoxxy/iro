# WhatsApp Webhook Setup (Meta Developer Console)

Use these values when configuring your WhatsApp webhook in the [Meta Developer Console](https://developers.facebook.com/):

---

## Callback URL

**Local development (with ngrok):**
```
https://YOUR-NGROK-URL/api/webhooks/whatsapp
```
Example: `https://abc123.ngrok.io/api/webhooks/whatsapp`

**Production:**
```
https://YOUR-DOMAIN/api/webhooks/whatsapp
```
Example: `https://iro.example.com/api/webhooks/whatsapp`

> **Note:** The frontend proxies `/api/*` to the backend. So if your app runs at `https://yourapp.com`, the callback URL is `https://yourapp.com/api/webhooks/whatsapp`.

---

## Verify Token

```
iro_whatsapp_verify
```

Or set your own in `.env`:
```
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
```
Then use that same value in the Meta Console.

---

## Steps

1. Go to [Meta for Developers](https://developers.facebook.com/) → Your App → WhatsApp → Configuration
2. Under **Webhook**, click **Edit**
3. **Callback URL:** Enter your URL (see above)
4. **Verify token:** Enter `iro_whatsapp_verify`
5. Click **Verify and Save**
6. Subscribe to **messages** (and any other fields you need)

---

## Local Testing with ngrok

```bash
ngrok http 4000
```

Use the HTTPS URL ngrok gives you (e.g. `https://abc123.ngrok-free.app`) as your domain in the Callback URL.
