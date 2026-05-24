# Company Chat Assistant

An AI-powered chat assistant platform that enables companies to provide intelligent customer support with integrated callback scheduling.

## Features

- **AI-Powered Chat**: OpenAI integration for intelligent customer responses
- **Company Customization**: Configurable company information, FAQs, and policies
- **Callback Scheduling**: Integrated system for scheduling customer callbacks
- **Token-Based Security**: Secure API tokens with domain validation
- **Real-time Dashboard**: Monitor conversations, analytics, and pending callbacks
- **Easy Integration**: Simple embed code for any website

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Functions)
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel
- **UI Components**: Radix UI, Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd company-chat-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin (for server-side)
FIREBASE_ADMIN_PROJECT_ID=your_firebase_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_firebase_admin_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_admin_client_email

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   │   ├── chat/          # Chat API
│   │   ├── callback/      # Callback API
│   │   └── company/       # Company management API
│   ├── dashboard/         # Dashboard pages
│   │   ├── company-setup/ # Company configuration
│   │   └── integration/   # Integration settings
│   └── page.tsx           # Home page
├── components/             # React components
│   └── ui/                # UI components
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                    # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── openai.ts          # OpenAI service
│   └── utils.ts           # Utility functions
└── types/                  # TypeScript type definitions
    └── index.ts           # Main type definitions
```

## API Endpoints

### Chat API
- `POST /api/chat` - Send message and get AI response
- `GET /api/chat` - Get chat history or company info

### Callback API
- `POST /api/callback` - Schedule callback request
- `GET /api/callback` - Get callback requests
- `PUT /api/callback` - Update callback status

### Company API
- `POST /api/company` - Create company
- `GET /api/company` - Get company information
- `PUT /api/company` - Update company

## Integration

### 1. Company Setup
1. Sign up and create an account
2. Configure company information, FAQs, and policies
3. Set business hours and callback preferences

### 2. Get Integration Code
1. Go to the Integration page
2. Copy your API token
3. Copy the embed code

### 3. Add to Website
```html
<!-- Company Chat Assistant -->
<div id="company-chat-widget"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://your-domain.com/widget.js';
  script.setAttribute('data-token', 'your_api_token');
  script.setAttribute('data-source-url', window.location.href);
  document.head.appendChild(script);
})();
</script>
```

## Security Features

- **Token Validation**: Each company has a unique API token
- **Domain Validation**: API calls are validated against allowed domains
- **Session Management**: Secure chat session handling
- **Authentication**: Firebase-based user authentication

## Customization

### Company Information
- Company name, description, and industry
- Website and logo
- Business hours and contact information
- Custom FAQs and policies

### AI Behavior
- Company-specific context and knowledge
- Intelligent callback detection
- Response confidence scoring
- Fallback to human callback when needed

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
Make sure to set all required environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Custom AI model training
- [ ] Mobile app
- [ ] Advanced callback scheduling
- [ ] Integration with CRM systems
- [ ] Webhook support
- [ ] Advanced security features
