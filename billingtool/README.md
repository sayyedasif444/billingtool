# Billing Tool

A modern, responsive billing and invoice management application built with Next.js, TypeScript, and Firebase.

## Features

- 🔐 **Custom Authentication** - Email/password authentication using Firestore
- 🏢 **Business Management** - Create and manage multiple businesses
- 📦 **Product Management** - Add, edit, and track product prices
- 📄 **Invoice Generation** - Create professional invoices with custom branding
- 🎨 **Logo Upload** - Upload and manage business logos (local storage)
- 📊 **Invoice Tracking** - Track invoice status and payment history
- 🖨️ **Print & PDF** - Print invoices or download as PDF
- 📧 **Email Integration** - Send invoices directly to customers via email
- 💰 **Multi-Currency Support** - Support for multiple currencies
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd billingtool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Email Configuration (Optional - for sending invoices via email)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password_or_app_password
   ```

4. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Set up Firestore security rules
   - Add your Firebase configuration to environment variables

5. **Set up uploads directory (Required for Logo Upload)**
   ```bash
   # Create the uploads directory structure
   npm run setup-uploads
   ```
   
   This will create the following directory structure:
   ```
   public/
   └── uploads/
       ├── .gitkeep
       └── business-logos/
           └── [business-id]/
               └── [timestamp]-logo.[extension]
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## File Upload System

The application uses a local file upload system for business logos and other files. This approach:

- ✅ **Cost-effective** - No cloud storage fees
- ✅ **Simple setup** - No CORS configuration needed
- ✅ **Fast uploads** - Direct local storage
- ✅ **Easy backup** - Files stored in your project directory

### Upload Directory Structure

```
public/uploads/
├── .gitkeep                    # Ensures directory is tracked by git
└── business-logos/             # Business logo uploads
    └── [business-id]/          # Each business has its own folder
        └── [timestamp]-logo.[extension]  # Unique filename for each upload
```

### File Management

- **Automatic cleanup**: Old files are not automatically deleted (you can implement cleanup if needed)
- **File validation**: Only image files (JPG, PNG, GIF) up to 5MB are allowed
- **Unique naming**: Files are renamed with timestamps to prevent conflicts
- **Path storage**: File paths are stored in the database as relative paths

## Email Integration

The application includes email functionality for sending invoices directly to customers. This feature:

- ✅ **Professional templates** - Beautiful HTML email templates
- ✅ **Automatic formatting** - Invoices are formatted for email display
- ✅ **Status tracking** - Invoice status updates when sent
- ✅ **Customizable messages** - Add personal messages to emails
- ✅ **Flexible configuration** - Support for multiple email providers

### Email Configuration

The application supports two email configuration methods:

#### Option 1: Service-based Configuration (Recommended for Gmail, Outlook, Yahoo)

1. **Set up email credentials** in your `.env.local` file:
   ```env
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password_or_app_password
   EMAIL_SERVICE=gmail
   ```

2. **For Gmail users**:
   - Enable 2-factor authentication on your Google account
   - Generate an App Password (Google Account → Security → App Passwords)
   - Use the App Password as `EMAIL_PASS`

3. **For other email providers**:
   - Change `EMAIL_SERVICE` to your provider (e.g., 'outlook', 'yahoo', 'hotmail')
   - Common services: 'outlook', 'yahoo', 'hotmail', 'icloud'

#### Option 2: Custom SMTP Configuration (For other providers)

1. **Set up custom SMTP settings** in your `.env.local` file:
   ```env
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   ```

2. **Common SMTP settings**:
   - **Gmail**: `smtp.gmail.com:587` (secure: false)
   - **Outlook**: `smtp-mail.outlook.com:587` (secure: false)
   - **Yahoo**: `smtp.mail.yahoo.com:587` (secure: false)
   - **Port 465 (SSL/TLS)**: Use `EMAIL_SECURE=true` (e.g., `smtp.example.com:465`)
   - **Port 587 (STARTTLS)**: Use `EMAIL_SECURE=false` (e.g., `smtp.example.com:587`)
   - **Custom server**: Use your provider's SMTP settings

### Email Features

- **Automatic recipient detection**: Uses customer email from invoice
- **Professional templates**: HTML emails with business branding
- **Invoice attachment**: Full invoice details included in email
- **Status updates**: Invoice status changes to 'sent' when emailed
- **Error handling**: Graceful handling of email failures

### Email Template

The email template includes:
- Business logo and branding
- Complete invoice details
- Itemized list with descriptions
- Summary with totals
- Professional styling
- Mobile-responsive design

## Firebase Security Rules

Set up the following Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /bill_users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == resource.data.email;
    }
    
    // Users can only access their own businesses
    match /bill_businesses/{businessId} {
      allow read, write: if request.auth != null && request.auth.token.email == resource.data.userId;
    }
    
    // Users can only access products from their businesses
    match /bill_products/{productId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/bill_businesses/$(resource.data.businessId)) &&
        get(/databases/$(database)/documents/bill_businesses/$(resource.data.businessId)).data.userId == request.auth.token.email;
    }
    
    // Users can only access invoices from their businesses
    match /bill_invoices/{invoiceId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/bill_businesses/$(resource.data.businessId)) &&
        get(/databases/$(database)/documents/bill_businesses/$(resource.data.businessId)).data.userId == request.auth.token.email;
    }
  }
}
```

## Troubleshooting

### File Upload Issues

1. **Uploads directory not found**: Run `npm run setup-uploads` to create the directory structure
2. **Permission denied**: Ensure the `public/uploads` directory has write permissions
3. **File not displaying**: Check that the file path is correct and the file exists in the uploads directory

### Firebase Configuration Issues

1. Ensure all environment variables are set correctly
2. Check that your Firebase project has Firestore enabled
3. Verify that your Firebase project ID matches the one in your environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
