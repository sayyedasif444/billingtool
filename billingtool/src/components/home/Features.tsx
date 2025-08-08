'use client';

import { motion } from 'framer-motion';
import { Store, Receipt, TrendingUp, Users, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Store,
    title: 'Multi-Business Management',
    description: 'Manage multiple business locations from a single dashboard. Each business can have its own products, pricing, and settings.'
  },
  {
    icon: Receipt,
    title: 'Smart Invoicing',
    description: 'Generate professional invoices automatically with customizable templates, tax calculations, and payment tracking.'
  },
  {
    icon: TrendingUp,
    title: 'Sales Analytics',
    description: 'Track your business performance with detailed sales reports, revenue analytics, and growth insights.'
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Maintain customer databases, track purchase history, and manage customer relationships effectively.'
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Bank-level security with data encryption and compliance with financial regulations and standards.'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'All your data syncs in real-time across devices, ensuring you always have the latest information.'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose Our Billing Tool?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built for modern businesses that need powerful, flexible, and easy-to-use billing solutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-lg border border-white/10 bg-black/30 hover:bg-black/50 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary to-blue-700 rounded-lg mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 