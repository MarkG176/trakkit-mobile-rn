/** Shared help/docs content aligned with the TraKKiT PWA. */

export const DOCS_URL = 'https://trakkit.darajatech.com/docs';

export const sharedFaqItems = [
  {
    question: 'How do I check in?',
    answer:
      'Tap the Record Attendance button on the Dashboard. Allow location access when prompted and take a selfie. Make sure you are within range of your assigned location and that GPS is turned on.',
  },
  {
    question: "My selfie won't upload — what do I do?",
    answer:
      "Check your internet connection. Make sure you've given the app camera permissions in your phone settings. Try switching between front and back camera, then switch back.",
  },
  {
    question: 'The app feels slow or is stuck',
    answer:
      'Close the app completely and reopen it. Make sure you have a stable internet connection. If the issue continues, submit a support ticket from More → Chat.',
  },
  {
    question: 'How do I view my stats?',
    answer:
      "Go to the Profile tab. You can see Today's metrics, This Week's summary, and work hours from your activity.",
  },
];

export const documentationFaqs = [
  {
    id: '1',
    question: 'How do I start a new survey?',
    answer:
      "Navigate to the Surveys page and tap 'Start Survey'. Select your survey template and begin.",
  },
  {
    id: '2',
    question: "What if I can't record audio?",
    answer: 'Check your microphone permissions in Settings. If issues persist, contact support.',
  },
  {
    id: '3',
    question: 'How are points calculated?',
    answer:
      'Points are awarded based on activity type: Sales (25pts), Surveys (15pts), Giveaways (8pts), Interactions (10pts).',
  },
];

export const documentCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started Guides',
    icon: 'book-outline' as const,
    accent: '#E8F1FF',
    iconColor: '#2563EB',
    documents: [
      { id: '1', title: 'Agent Onboarding Guide' },
      { id: '2', title: 'Mobile App Basics' },
      { id: '3', title: 'First Day Checklist' },
    ],
  },
  {
    id: 'how-to',
    title: 'How-To Guides',
    icon: 'help-circle-outline' as const,
    accent: '#E8F8EF',
    iconColor: '#16A34A',
    documents: [
      { id: '4', title: 'How to Conduct a Survey' },
      { id: '5', title: 'Recording Best Practices' },
      { id: '6', title: 'Customer Interaction Guidelines' },
      { id: '7', title: 'Troubleshooting Guide' },
    ],
  },
  {
    id: 'products',
    title: 'Product Catalogs',
    icon: 'briefcase-outline' as const,
    accent: '#F3E8FF',
    iconColor: '#9333EA',
    documents: [
      { id: '8', title: 'Solar Panel Specifications' },
      { id: '9', title: 'LED Product Catalog' },
      { id: '10', title: 'Pricing Guide' },
    ],
  },
];

export const popularHelpTopics = [
  { title: 'How to record a sale', category: 'Sales' },
  { title: 'Troubleshooting recording issues', category: 'Technical' },
  { title: 'Understanding point system', category: 'General' },
  { title: 'Managing offline data', category: 'Technical' },
];

export function buildFaqItems() {
  return [...sharedFaqItems];
}
