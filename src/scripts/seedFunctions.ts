import { hash } from 'bcryptjs';
import User from '@/models/user';
import Property from '@/models/property';
import Appointment from '@/models/appointment';
import connectMongo from '@/lib/connectMongo';

// Real property image URLs (from Unsplash) - organized by property type
const propertyImagesByType = {
  Studio: [
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea',
    'https://images.unsplash.com/photo-1600607688969-a5bfaa646ca9',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    'https://images.unsplash.com/photo-1560448075-bb485b067938',
  ],
  Unit: [
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea',
    'https://images.unsplash.com/photo-1600607688969-a5bfaa646ca9',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    'https://images.unsplash.com/photo-1560448075-bb485b067938',
  ],
  Apartment: [
    'https://images.unsplash.com/photo-1605146769289-440113cc3d00',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea',
    'https://images.unsplash.com/photo-1600607688969-a5bfaa646ca9',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    'https://images.unsplash.com/photo-1560448075-bb485b067938',
  ],
  Duplex: [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83',
  ],
  Townhouse: [
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83',
  ],
  House: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83',
  ],
  Villa: [
    'https://images.unsplash.com/photo-1600607688969-a5bfaa646ca9',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83',
  ],
};

const australianSuburbs = [
  // NSW
  { suburb: 'Bondi', state: 'NSW', postcode: '2026' },
  { suburb: 'Manly', state: 'NSW', postcode: '2095' },
  { suburb: 'Surry Hills', state: 'NSW', postcode: '2010' },
  { suburb: 'Paddington', state: 'NSW', postcode: '2021' },
  { suburb: 'Newtown', state: 'NSW', postcode: '2042' },
  { suburb: 'Darlinghurst', state: 'NSW', postcode: '2010' },
  { suburb: 'Potts Point', state: 'NSW', postcode: '2011' },
  { suburb: 'Balmain', state: 'NSW', postcode: '2041' },
  { suburb: 'Leichhardt', state: 'NSW', postcode: '2040' },
  { suburb: 'Glebe', state: 'NSW', postcode: '2037' },

  // VIC
  { suburb: 'Richmond', state: 'VIC', postcode: '3121' },
  { suburb: 'South Yarra', state: 'VIC', postcode: '3141' },
  { suburb: 'Fitzroy', state: 'VIC', postcode: '3065' },
  { suburb: 'Carlton', state: 'VIC', postcode: '3053' },
  { suburb: 'St Kilda', state: 'VIC', postcode: '3182' },
  { suburb: 'Prahran', state: 'VIC', postcode: '3181' },
  { suburb: 'Collingwood', state: 'VIC', postcode: '3066' },
  { suburb: 'Toorak', state: 'VIC', postcode: '3142' },
  { suburb: 'Brighton', state: 'VIC', postcode: '3186' },
  { suburb: 'Hawthorn', state: 'VIC', postcode: '3122' },

  // QLD
  { suburb: 'Fortitude Valley', state: 'QLD', postcode: '4006' },
  { suburb: 'South Bank', state: 'QLD', postcode: '4101' },
  { suburb: 'New Farm', state: 'QLD', postcode: '4005' },
  { suburb: 'Paddington', state: 'QLD', postcode: '4064' },
  { suburb: 'West End', state: 'QLD', postcode: '4101' },
  { suburb: 'Teneriffe', state: 'QLD', postcode: '4005' },
  { suburb: 'Kangaroo Point', state: 'QLD', postcode: '4169' },
  { suburb: 'Woolloongabba', state: 'QLD', postcode: '4102' },

  // WA
  { suburb: 'Fremantle', state: 'WA', postcode: '6160' },
  { suburb: 'Subiaco', state: 'WA', postcode: '6008' },
  { suburb: 'Cottesloe', state: 'WA', postcode: '6011' },
  { suburb: 'Leederville', state: 'WA', postcode: '6007' },
  { suburb: 'Mount Lawley', state: 'WA', postcode: '6050' },
  { suburb: 'Northbridge', state: 'WA', postcode: '6003' },

  // SA
  { suburb: 'Adelaide', state: 'SA', postcode: '5000' },
  { suburb: 'North Adelaide', state: 'SA', postcode: '5006' },
  { suburb: 'Glenelg', state: 'SA', postcode: '5045' },
  { suburb: 'Unley', state: 'SA', postcode: '5061' },

  // ACT
  { suburb: 'Canberra', state: 'ACT', postcode: '2600' },
  { suburb: 'Braddon', state: 'ACT', postcode: '2612' },
  { suburb: 'Kingston', state: 'ACT', postcode: '2604' },
];

export async function seedAdminUser() {
  await connectMongo();

  const adminEmail = 'admin@hometrace.com';
  const adminPassword = 'H0metrace';

  // Delete existing admin user to ensure clean reset
  await User.deleteMany({ email: adminEmail });

  const hashedPassword = await hash(adminPassword, 12);

  await User.create({
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  });

  return {
    success: true,
    message: 'Admin user created successfully',
    email: adminEmail,
  };
}

export async function seedAgentUsers() {
  await connectMongo();

  // First, delete all existing agent users to ensure clean reset
  await User.deleteMany({ role: 'agent' });

  const agents = [
    {
      email: 'agent1@hometrace.com',
      password: 'Agent123',
      firstName: 'John',
      lastName: 'Smith',
    },
    {
      email: 'agent2@hometrace.com',
      password: 'Agent123',
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
    {
      email: 'agent3@hometrace.com',
      password: 'Agent123',
      firstName: 'Michael',
      lastName: 'Brown',
    },
  ];

  const createdAgents = [];

  for (const agentData of agents) {
    const hashedPassword = await hash(agentData.password, 12);

    const agent = await User.create({
      email: agentData.email,
      password: hashedPassword,
      role: 'agent',
      firstName: agentData.firstName,
      lastName: agentData.lastName,
    });

    createdAgents.push(agent);
  }

  return {
    success: true,
    message: `Created ${createdAgents.length} agent users`,
    agents: createdAgents.map((agent) => ({
      id: agent._id,
      email: agent.email,
      name: `${agent.firstName} ${agent.lastName}`,
    })),
  };
}

export async function seedSampleProperties() {
  await connectMongo();

  // Delete all existing properties to ensure clean reset
  await Property.deleteMany({});

  // Get all agent users to assign properties to them
  const agents = await User.find({ role: 'agent' });
  if (agents.length === 0) {
    throw new Error('No agents found. Please seed agent users first.');
  }

  // Property types ordered by average price (low to high)
  const propertyTypes = [
    'Studio',
    'Unit',
    'Apartment',
    'Duplex',
    'Townhouse',
    'House',
    'Villa',
  ];
  const features = [
    'Pool',
    'Gym',
    'Garage',
    'Garden',
    'Air Conditioning',
    'Balcony',
  ];

  const sampleProperties = Array(100)
    .fill(0)
    .map((_, i) => {
      const location =
        australianSuburbs[Math.floor(Math.random() * australianSuburbs.length)];
      const streetNumber = Math.floor(Math.random() * 100) + 1;
      const currentPropertyType = propertyTypes[i % propertyTypes.length];

      // Get appropriate images for the property type
      const typeImages =
        propertyImagesByType[
          currentPropertyType as keyof typeof propertyImagesByType
        ] || propertyImagesByType.House;
      // Generate 6 unique images for each property
      const selectedImages: string[] = [];
      const usedIndices = new Set<number>();

      while (selectedImages.length < 6) {
        const randomIndex = Math.floor(Math.random() * typeImages.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          selectedImages.push(typeImages[randomIndex]);
        }
        // If we've used all available images, start reusing them
        if (
          usedIndices.size === typeImages.length &&
          selectedImages.length < 6
        ) {
          usedIndices.clear();
        }
      }

      // Assign agent to property (distribute evenly among agents)
      const assignedAgent = agents[i % agents.length];

      return {
        description: `${currentPropertyType} with ${(i % 5) + 1} bedrooms in ${location.suburb}`,
        price: (() => {
          // Generate price based on property type (reflecting market averages)
          switch (currentPropertyType) {
            case 'Studio':
              return 300000 + Math.floor(Math.random() * 200000);
            case 'Unit':
              return 400000 + Math.floor(Math.random() * 300000);
            case 'Apartment':
              return 500000 + Math.floor(Math.random() * 400000);
            case 'Duplex':
              return 600000 + Math.floor(Math.random() * 500000);
            case 'Townhouse':
              return 700000 + Math.floor(Math.random() * 600000);
            case 'House':
              return 800000 + Math.floor(Math.random() * 1200000);
            case 'Villa':
              return 1200000 + Math.floor(Math.random() * 1800000);
            default:
              return 500000 + Math.floor(Math.random() * 1000000);
          }
        })(),
        bedrooms: Math.min(5, Math.floor(Math.random() * 5) + 1),
        bathrooms: Math.min(4, Math.floor(Math.random() * 3) + 1),
        propertyType: currentPropertyType,
        agentId: assignedAgent._id, // Assign the property to an agent
        address: {
          street: `${streetNumber} Sample Street`,
          suburb: location.suburb,
          state: location.state,
          postcode: location.postcode,
          country: 'Australia',
        },
        features: features.slice(0, Math.floor(Math.random() * 3) + 1),
        images: selectedImages.map(
          (url) => `${url}?auto=format&fit=crop&w=800&h=600&q=80`,
        ),
      };
    });

  const result = await Property.insertMany(sampleProperties);

  return {
    success: true,
    count: result.length,
    message: `Successfully seeded ${result.length} properties`,
  };
}

export async function seedSampleAppointments() {
  await connectMongo();

  // Delete all existing appointments to ensure clean reset
  await Appointment.deleteMany({});

  // Get all properties with their agents
  const properties = await Property.find();
  if (properties.length === 0) {
    throw new Error('No properties found. Please seed properties first.');
  }

  // Sample customer data
  const customers = [
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@email.com',
      phone: '+61 400 123 456',
    },
    {
      firstName: 'James',
      lastName: 'Davis',
      email: 'james.davis@email.com',
      phone: '+61 400 234 567',
    },
    {
      firstName: 'Olivia',
      lastName: 'Taylor',
      email: 'olivia.taylor@email.com',
      phone: '+61 400 345 678',
    },
    {
      firstName: 'William',
      lastName: 'Anderson',
      email: 'william.anderson@email.com',
      phone: '+61 400 456 789',
    },
    {
      firstName: 'Sophia',
      lastName: 'Thomas',
      email: 'sophia.thomas@email.com',
      phone: '+61 400 567 890',
    },
    {
      firstName: 'Benjamin',
      lastName: 'Jackson',
      email: 'benjamin.jackson@email.com',
      phone: '+61 400 678 901',
    },
    {
      firstName: 'Charlotte',
      lastName: 'White',
      email: 'charlotte.white@email.com',
      phone: '+61 400 789 012',
    },
    {
      firstName: 'Lucas',
      lastName: 'Harris',
      email: 'lucas.harris@email.com',
      phone: '+61 400 890 123',
    },
    {
      firstName: 'Amelia',
      lastName: 'Martin',
      email: 'amelia.martin@email.com',
      phone: '+61 400 901 234',
    },
    {
      firstName: 'Henry',
      lastName: 'Thompson',
      email: 'henry.thompson@email.com',
      phone: '+61 400 012 345',
    },
    {
      firstName: 'Isabella',
      lastName: 'Garcia',
      email: 'isabella.garcia@email.com',
      phone: '+61 400 111 222',
    },
    {
      firstName: 'Alexander',
      lastName: 'Martinez',
      email: 'alexander.martinez@email.com',
      phone: '+61 400 333 444',
    },
    {
      firstName: 'Mia',
      lastName: 'Rodriguez',
      email: 'mia.rodriguez@email.com',
      phone: '+61 400 555 666',
    },
    {
      firstName: 'Ethan',
      lastName: 'Lewis',
      email: 'ethan.lewis@email.com',
      phone: '+61 400 777 888',
    },
    {
      firstName: 'Ava',
      lastName: 'Lee',
      email: 'ava.lee@email.com',
      phone: '+61 400 999 000',
    },
  ];

  // Generate appointment times for the next 30 days
  const generateAppointmentTimes = () => {
    const times = ['10:00', '11:00', '14:00', '15:00', '16:00'];
    const dates = [];

    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD format
    }

    return dates.map((date) => ({
      date,
      time: times[Math.floor(Math.random() * times.length)],
    }));
  };

  const appointmentTimes = generateAppointmentTimes();
  const statuses = ['pending', 'confirmed', 'cancelled'];
  const sampleAppointments = [];

  // Create 50 sample appointments (more realistic for 100 properties)
  for (let i = 0; i < 50; i++) {
    const randomProperty =
      properties[Math.floor(Math.random() * properties.length)];
    const randomCustomer =
      customers[Math.floor(Math.random() * customers.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Generate 1-3 appointment slots per request
    const numSlots = Math.floor(Math.random() * 3) + 1;
    const appointmentSlots = [];

    for (let j = 0; j < numSlots; j++) {
      const slotTime =
        appointmentTimes[Math.floor(Math.random() * appointmentTimes.length)];
      appointmentSlots.push(slotTime);
    }

    // For confirmed appointments, set agentScheduledDateTime
    let agentScheduledDateTime = undefined;
    if (randomStatus === 'confirmed' && appointmentSlots.length > 0) {
      // Use the first preferred date as the confirmed time
      const firstSlot = appointmentSlots[0];
      agentScheduledDateTime = new Date(`${firstSlot.date}T${firstSlot.time}`);
    }

    const appointment = {
      propertyId: randomProperty._id,
      agentId: randomProperty.agentId?._id || null,
      firstName: randomCustomer.firstName,
      lastName: randomCustomer.lastName,
      email: randomCustomer.email,
      phone: randomCustomer.phone,
      customerPreferredDates: appointmentSlots,
      agentScheduledDateTime,
      status: randomStatus,
      message:
        i % 3 === 0
          ? `I'm interested in viewing this ${randomProperty.propertyType?.toLowerCase() || 'property'}. Please let me know your availability.`
          : undefined,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ), // Random date within last 7 days
    };

    sampleAppointments.push(appointment);
  }

  const result = await Appointment.insertMany(sampleAppointments);

  return {
    success: true,
    count: result.length,
    message: `Successfully seeded ${result.length} appointments`,
  };
}
