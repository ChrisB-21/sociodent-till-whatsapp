import React, { useEffect } from 'react';
import { 
  Calendar, 
  ShieldCheck,
  Clock,
  BadgeCheck,
  ShoppingBag,
  HeartPulse
} from 'lucide-react';

const FeaturesSection = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));
    
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const features = [
    {
      icon: <Calendar size={24} />,
      title: 'Easy Scheduling',
      description: 'Book appointments online anytime, anywhere without the hassle.',
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Secure Platform',
      description: 'Your data and privacy are protected with industry-standard security.',
    },
    {
      icon: <Clock size={24} />,
      title: '24/7 Access',
      description: 'Access your dental care information and services round the clock.',
    },
    {
      icon: <BadgeCheck size={24} />,
      title: 'Verified Professionals',
      description: 'Every dentist is thoroughly vetted and certified for quality care.',
    },
    {
      icon: <ShoppingBag size={24} />,
      title: 'Dental Products',
      description: 'Shop quality dental care products recommended by experts.',
    },
    {
      icon: <HeartPulse size={24} />,
      title: 'Quality Care',
      description: 'Get top-notch dental care from experienced professionals.',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="reveal-on-scroll inline-block px-3 py-1 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="reveal-on-scroll text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            The Future of Dental Care
          </h2>
          <p className="reveal-on-scroll text-lg text-gray-600 max-w-2xl mx-auto">
            Experience modern dentistry that puts your comfort and convenience first. We've reimagined every aspect of dental care.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="reveal-on-scroll p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-sociodent-50 text-sociodent-600 rounded-xl mb-5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;