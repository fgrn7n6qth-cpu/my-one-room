# Email SMTP Setup

The backend sends signup verification emails through standard SMTP.
That means Gmail, Naver, and iCloud can all work without code changes,
as long as the matching environment variables are set.

The app reads these variables:

```bash
SPRING_MAIL_HOST
SPRING_MAIL_PORT
SPRING_MAIL_USERNAME
SPRING_MAIL_PASSWORD
SPRING_MAIL_SMTP_AUTH
SPRING_MAIL_SMTP_STARTTLS_ENABLE
SPRING_MAIL_SMTP_STARTTLS_REQUIRED
SPRING_MAIL_SMTP_SSL_ENABLE
SPRING_MAIL_SMTP_SSL_TRUST
APP_MAIL_FROM
```

## Gmail

Use an App Password, not your normal Gmail password.

```bash
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-account@gmail.com
SPRING_MAIL_PASSWORD=your-16-char-app-password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_SMTP_STARTTLS_REQUIRED=false
SPRING_MAIL_SMTP_SSL_ENABLE=false
SPRING_MAIL_SMTP_SSL_TRUST=smtp.gmail.com
APP_MAIL_FROM=your-account@gmail.com
```

Gmail checklist:

- Google Account `2-Step Verification` must be enabled.
- `SPRING_MAIL_PASSWORD` must be the 16-character `App Password`.
- `APP_MAIL_FROM` must match `SPRING_MAIL_USERNAME`.
- If you changed environment variables in IntelliJ, stop the app completely and run it again.

## Naver Mail

Recommended setup for this project is `465 + SSL`.
Naver official guides also mention `587 + TLS/STARTTLS` in some clients, but for this backend we recommend the simpler `465 + SSL` path first.

```bash
SPRING_MAIL_HOST=smtp.naver.com
SPRING_MAIL_PORT=465
SPRING_MAIL_USERNAME=your-id
SPRING_MAIL_PASSWORD=your-12-char-app-password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=false
SPRING_MAIL_SMTP_STARTTLS_REQUIRED=false
SPRING_MAIL_SMTP_SSL_ENABLE=true
SPRING_MAIL_SMTP_SSL_TRUST=smtp.naver.com
APP_MAIL_FROM=your-id@naver.com
```

Naver checklist:

- Naver `2-step verification` must be enabled.
- Use a newly generated `application password`, not your normal login password.
- In Naver Mail settings, `POP3/SMTP` or `IMAP/SMTP` must be turned on.
- Try `SPRING_MAIL_USERNAME=your-id` first.
- `APP_MAIL_FROM` should be the full Naver mail address.

## iCloud Mail

Use an app-specific password from Apple account settings.
iCloud commonly works with SMTPS on port `465`.

```bash
SPRING_MAIL_HOST=smtp.mail.me.com
SPRING_MAIL_PORT=465
SPRING_MAIL_USERNAME=your-account@icloud.com
SPRING_MAIL_PASSWORD=your-app-specific-password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=false
SPRING_MAIL_SMTP_STARTTLS_REQUIRED=false
SPRING_MAIL_SMTP_SSL_ENABLE=true
SPRING_MAIL_SMTP_SSL_TRUST=smtp.mail.me.com
APP_MAIL_FROM=your-account@icloud.com
```

## Run Example

PowerShell example before starting the backend:

```powershell
$env:SPRING_MAIL_HOST="smtp.naver.com"
$env:SPRING_MAIL_PORT="465"
$env:SPRING_MAIL_USERNAME="your-id"
$env:SPRING_MAIL_PASSWORD="your-12-char-app-password"
$env:SPRING_MAIL_SMTP_AUTH="true"
$env:SPRING_MAIL_SMTP_STARTTLS_ENABLE="false"
$env:SPRING_MAIL_SMTP_STARTTLS_REQUIRED="false"
$env:SPRING_MAIL_SMTP_SSL_ENABLE="true"
$env:SPRING_MAIL_SMTP_SSL_TRUST="smtp.naver.com"
$env:APP_MAIL_FROM="your-id@naver.com"
.\mvnw.cmd spring-boot:run
```

## Notes

- Gmail requires 2-Step Verification plus an App Password.
- Naver requires 2-Step Verification plus an application password.
- iCloud requires an app-specific password.
- `APP_MAIL_FROM` should usually match the SMTP account address.
- If mail still does not arrive, check the backend response message and spam folder.

## Production

For production, prefer real environment variables or your deployment platform's secret manager.
Do not commit `.mail-local.properties` or any real mail password.

Recommended production variables:

```bash
SPRING_MAIL_HOST=...
SPRING_MAIL_PORT=...
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_SMTP_STARTTLS_REQUIRED=false
SPRING_MAIL_SMTP_SSL_ENABLE=false
SPRING_MAIL_SMTP_SSL_TRUST=...
APP_MAIL_FROM=...
APP_EMAIL_VERIFICATION_TTL=PT10M
```

Deployment checklist:

- Store SMTP credentials only in environment variables or secrets.
- Keep `APP_MAIL_FROM` aligned with the actual sending account.
- Rotate app passwords if they were ever exposed in logs, screenshots, or chat.
- Test one real signup flow after each mail credential change.
