import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Parent of a child with autism",
      role: "Caregiver",
      image: "", // Blank profile
      content: "It's really hard to find dental care providers who understand the sensory sensitivities my child has during oral hygiene routines.",
      rating: 5
    },
    {
      id: 2,
      name: "Caregiver of elderly parent",
      role: "Caregiver",
      image: "", // Blank profile
      content: "Brushing and oral care for my elderly father, who is bedridden, is difficult because I don't have the right tools or training to do it safely at home.",
      rating: 5
    },
    {
      id: 3,
      name: "Occupational therapist working with children with disabilities",
      role: "Professional",
      image: "", // Blank profile
      content: "Sensory challenges make dental visits overwhelming for many children with disabilities, so they avoid oral care altogether.",
      rating: 5
    },
    {
      id: 4,
      name: "Special needs educator",
      role: "Professional",
      image: "", // Blank profile
      content: "Many children with disabilities resist toothbrushing due to discomfort, and without proper guidance, caregivers feel frustrated and helpless.",
      rating: 5
    },
    {
      id: 5,
      name: "Parent of child with Down syndrome",
      role: "Caregiver",
      image: "", // Blank profile
      content: "Parents and caregivers often feel helpless because clinic visits are exhausting or impossible for their children with severe disabilities.",
      rating: 5
    },
    {
      id: 6,
      name: "Parent of a child with intellectual disability",
      role: "Caregiver",
      image: "", // Blank profile
      content: "Traveling to dental clinics is stressful and exhausting for my child with disabilities; home-based care would make a huge difference.",
      rating: 5
    }
  ];

  return (
    <section className="py-10 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="reveal-on-scroll inline-block px-3 py-1 mb-6 bg-sociodent-100 text-sociodent-700 rounded-full text-sm font-medium">
            Voices that matter
          </span>
          <h2 className="reveal-on-scroll text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What our patrons say
          </h2>
          <p className="reveal-on-scroll text-lg text-gray-600 max-w-2xl mx-auto">
            Real world experiences from our ecosystem partners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="reveal-on-scroll glass-card rounded-2xl p-6 bg-white"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>

              <p className="text-gray-600">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;