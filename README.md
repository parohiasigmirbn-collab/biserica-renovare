# Biserica Sfântul Nicolae din Sigmir

Site public și panou CMS găzduite pe Netlify.

## Administrare

Panoul este disponibil la `/admin/`. Conținutul paginilor este păstrat în Netlify Database, iar imaginile încărcate sunt păstrate în Netlify Blobs.

Primul administrator se configurează din panoul Netlify:

1. Deschide **Identity** pentru proiect și invită adresa de email a administratorului.
2. După acceptarea invitației, deschide utilizatorul și adaugă rolul `admin`.
3. Autentifică-te la `/admin/` cu acel cont.

Conturile fără rolul `admin` nu pot citi sau modifica datele panoului, chiar dacă sunt autentificate.
