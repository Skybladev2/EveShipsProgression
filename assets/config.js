/* EVE Online SSO settings.
   The login uses the OAuth 2.0 Authorization Code flow with PKCE, so it runs
   fully in the browser and needs no server and no Client Secret (EVE generates
   one, but this flow never uses it — never put a secret in a file the browser
   can read). EVE's SSO does not support the implicit flow (`response_type=
   token`); PKCE is the client-side-safe alternative.

   Because the callback URL must match the registered URL exactly, the Client
   ID usually differs between local testing and the deployed site. Fill in both
   entries below; the right one is picked from the hostname at runtime:
   `localhost` / `127.0.0.1` use `local`, everything else uses `production`.

   Setup:
     1. Register one application per environment at
        https://developers.eveonline.com/applications (or one application with
        two callback URLs, if you prefer the same Client ID for both).
        Choose the "Authorization Code" / PKCE style (no secret required).
     2. Set each Callback URL to the exact address the chart runs at:
        - local:      http://localhost:8000/
        - production: https://<user>.github.io/<repo>/
     3. Paste each Client ID below. Leave an entry as "" to disable the login
        button in that environment.
   Overrides: ?sso_client_id=...&sso_redirect_uri=... in the URL still wins over
   everything here, so a deployment can be pointed at another app without an edit.
*/
window.EVE_SSO_CONFIG = (function () {
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "";
  // Default callback: the page's own URL, with a trailing index.html removed so
  // it matches the registered "directory" URL as closely as possible.
  var here = location.origin + location.pathname.replace(/index\.html?$/i, "");

  var environments = {
    local: {
      client_id: "6fc1e03812a14753819fda3df51b8c95",
      // http://localhost:8000/ and friends — the exact address you open.
      redirect_uri: here
    },
    production: {
      client_id: "5d82ef84eec948b0aa9e649a239b9195",
      // The deployed site. Leave null to use the page's own URL instead.
      redirect_uri: null
    }
  };

  var picked = isLocal ? environments.local : environments.production;
  return {
    client_id: picked.client_id || "",
    redirect_uri: picked.redirect_uri || here,
    scope: "esi-skills.read_skills.v1"
  };
})();
