import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Award,
  Heart,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Steward Gracian",
    role: "Founder & CEO",
    image: "/doc-img/Steward.png",
    details: `A General Dentist turned social entrepreneur with over a decade of experience across clinical
and non-clinical roles. He is the founder of SocioDent, an early-stage MedTech startup
focused on dental innovations. With a strong passion for improving oral health awareness and
accessibility, he has worked extensively in rural public health and social innovation to break
existing barriers in dentistry.

Dr. Steward has been recognized as an SBI Youth for India Fellow, BIRAC Social
Innovation Fellow, and a BIRAC BIG Grant recipient, reflecting his contributions to biotechnology and healthcare innovation. He was also part of the winning team at the MIT
Grand Hack 2020, highlighting his ability to solve complex healthcare challenges.

Under his leadership, SocioDent has received support from several reputed incubators,
including KIIT-TBI, IITM HTIC MedTech Incubator, SIIC IIT Kanpur, and IIHMR Startups. He
also holds a Postgraduate Diploma in Healthcare Entrepreneurship, providing him with a
strong foundation in health management.`
  },
  {
    name: "Dr. A. Victor Samuel",
    role: "Chief Medical Officer",
    image: "/doc-img/Dr.A.Victor-samuel-MDS.jpg",
    details: `Experienced Pediatric Dentist with over 15 years of clinical, academic, and research
expertise. He is widely recognized for his contributions to dental innovation, holding 3 patents and authoring over 40 national and international publications. His core interest lies in
developing assistive technologies that enhance pediatric oral health, particularly for children with special needs.

He is empaneled with the National Accreditation Board for Hospitals & Healthcare Providers
(NABH) under the Quality Council of India as a Principal Assessor, reflecting his
commitment to quality and standards in healthcare delivery.

A former President of the Indian Dental Association – Greater Chennai Branch, Dr. Victor
has also authored and contributed to a couple of textbooks in pediatric dentistry. His work
bridges the gap between clinical practice and innovation, aiming to create inclusive and
impactful dental care solutions for every child.`
  }
];

const values = [
  {
    icon: <CheckCircle className="h-8 w-8 text-sociodent-600" />,
    title: "Quality Care",
    description: "We partner only with qualified, licensed dentists who meet our high standards of care and professionalism."
  },
  {
    icon: <Heart className="h-8 w-8 text-sociodent-600" />,
    title: "Patient-Centered",
    description: "Everything we do is designed around patient needs, comfort, and convenience. Your dental health comes first."
  },
  {
    icon: <Award className="h-8 w-8 text-sociodent-600" />,
    title: "Innovation",
    description: "We leverage technology to create better dental care experiences, from teledentistry to our digital health records."
  },
  {
    icon: <Users className="h-8 w-8 text-sociodent-600" />,
    title: "Inclusivity",
    description: "We believe everyone deserves access to quality dental care regardless of location, income, or schedule."
  },
  {
    icon: <MapPin className="h-8 w-8 text-sociodent-600" />,
    title: "Accessibility",
    description: "With virtual, home, and clinic options, we make it easy to get the dental care you need on your terms."
  },
  {
    icon: <Clock className="h-8 w-8 text-sociodent-600" />,
    title: "Efficiency",
    description: "We streamline the entire dental care process, from booking appointments to receiving treatment."
  }
];

const About = () => {
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    };

    checkAuth();
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-sociodent-50 to-white relative overflow-hidden">
          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="text-coral-500">Breaking Barriers</span>{" "}
                <span className="text-gray-900">In Oral Healthcare</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 mb-8">
                We're on a mission to redefine access to oral healthcare by connecting children,
                the elderly, and individuals with special needs to compassionate dental
                professionals through home visits, virtual consultations, and inclusive dental
                solutions
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {isAuthenticated ? (
                  <Link 
                    to="/consultation" 
                    className="button-primary"
                  >
                    Find a Dentist
                  </Link>
                ) : (
                  <Link 
                    to="/auth?mode=signup" 
                    className="button-primary"
                  >
                    Register Now
                  </Link>
                )}
                <Link 
                  to="/products" 
                  className="button-secondary"
                >
                  Shop Products
                </Link>
              </div>
            </div>
          </div>
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-sociodent-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-sociodent-200 rounded-full opacity-20 blur-3xl"></div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                  Our Story
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Transforming Special Care Dentistry
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    SocioDent began with a bold vision: to make oral healthcare accessible, inclusive, and dignified.
                  </p>
                  <p>
                    Our journey started when our founder, Dr. Steward Gracian, recognized the barriers faced by
                    hospitalized individuals, dependent elderly, and children with disabilities in performing day-to-day
                    oral care.
                  </p>
                  <p>
                    What began as a product innovation startup has now evolved into a holistic and inclusive
                    platform-connecting patients to empathetic dentists and offering specially designed oral care products.
                  </p>
                  <p>
                    Today, SocioDent promises to grow as a trusted name in special care dentistry, dedicated to
                    ensuring that every SocioDent-regardless of ability-receives the care it deserves.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="SocioDent team"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                Our Team
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Meet the Leadership
              </h2>
              <p className="text-xl text-gray-600">
                Our diverse team of experts is passionate about transforming dental care access.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className="aspect-square rounded-full overflow-hidden mb-4 mx-auto max-w-[200px] bg-white shadow-sm cursor-pointer"
                    onClick={() =>
                      setActiveMember(activeMember === member.name ? null : member.name)
                    }
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sociodent-600 mb-4">{member.role}</p>
                  {activeMember === member.name && (
                    <div className="text-gray-700 text-base whitespace-pre-line mt-2">
                      {member.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                Our Values
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                What Makes Us Different
              </h2>
              <p className="text-xl text-gray-600">
                Our core values guide everything we do, from how we build our platform to how we interact with our patients and dentists.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-sociodent-50 rounded-full flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
                  Contact Us
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Get in Touch
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Have questions about our services? We're here to help.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-sociodent-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-sociodent-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Office Location</h3>
                      <p className="text-gray-600">
                        Sociodent Private Limited<br />
                        IITM Research Park, No. 1 FA, I Floor, Kanagam Road, Taramani, Adayar, Chennai-600 113, Tamil Nadu, India
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-sociodent-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-sociodent-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                      <p className="text-gray-600">+91 90435 61043</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-sociodent-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-sociodent-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Email</h3>
                      <p className="text-gray-600">steward@sociodent.in</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-sociodent-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-sociodent-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Support Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 8am - 8pm EST</p>
                      <p className="text-gray-600">Saturday: 9am - 5pm EST</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;