# Security Policy

## Environment Variables

This application requires several environment variables to function properly. Never commit these values to the repository.

### Required Variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Email Configuration
EMAIL_USER=
EMAIL_PASS=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` for documentation
   - Keep secrets secure and rotate regularly

2. **File Uploads**
   - All uploads are stored in `/public/uploads/business-logos/`
   - Each business has its own directory
   - Only image files are allowed
   - File size and type restrictions are enforced

3. **Email Security**
   - Use environment variables for SMTP credentials
   - Enable TLS/SSL for secure email transmission
   - Validate email addresses
   - Sanitize email content

4. **Firebase Security**
   - Use appropriate Firebase security rules
   - Implement proper authentication
   - Regular security audits
   - Keep Firebase SDK updated

## Reporting a Vulnerability

If you discover a security vulnerability, please DO NOT create a public issue. Instead:

1. Email the maintainers directly
2. Provide detailed information about the vulnerability
3. Allow reasonable time for response and fixes
4. Disclose responsibly

We take all security reports seriously and will respond as quickly as possible.