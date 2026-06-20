import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, IUser } from '../models/User.js';
import { Address } from '../models/Address.js';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

dotenv.config();

// Bcrypt hash for password "customer123" used for customer testing
const PLACEHOLDER_HASH = '$2b$10$xbeKLZd7Nn0T./4UqZrlBOWbQrcxBZio3sviCE92dSavrKHNvdVLy';

export interface RawSeedUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  isEmailVerified: boolean;
  phone?: string;
  address?: string;
  city?: string;
  state: string;
  postalCode: string;
  country: string;
  shopperType?: 'frequent' | 'occasional' | 'inactive';
  lastLoginAt?: Date;
}

export const rawUsersData: RawSeedUser[] = [
  // 1 Admin
  {
    name: 'Poise Administrator',
    email: 'admin@example.com',
    passwordHash: '$2b$10$cF6FkykCaNHYmIzKhAvwWu/L/uuSdoVQTFQY9JKOmxPl/uN16zmPq', // bcrypt hash for "admin123"
    role: 'admin',
    isEmailVerified: true,
    phone: '+1-555-0100',
    address: '77 Headquarters Blvd Suite 100',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'United States',
    lastLoginAt: new Date('2026-06-20T08:00:00Z')
  },

  // 18 Frequent Shoppers
  {
    name: 'Alice Smith',
    email: 'alice.smith@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1001',
    address: '101 Pine Road',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94101',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T14:30:00Z')
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1002',
    address: '202 Elm Street',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-20T01:15:00Z')
  },
  {
    name: 'Clara Dupont',
    email: 'clara.dupont@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+33-1-4227-7890',
    address: '15 Rue de Rivoli',
    city: 'Paris',
    state: 'Île-de-France',
    postalCode: '75001',
    country: 'France',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-18T09:45:00Z')
  },
  {
    name: 'David Miller',
    email: 'david.miller@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+49-30-123456',
    address: '42 Lindenstraße',
    city: 'Berlin',
    state: 'Berlin',
    postalCode: '10969',
    country: 'Germany',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T18:20:00Z')
  },
  {
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-20-7946-0192',
    address: '58 Baker St',
    city: 'London',
    state: 'England',
    postalCode: 'NW1 6XE',
    country: 'United Kingdom',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-20T00:05:00Z')
  },
  {
    name: 'Frank Tanaka',
    email: 'frank.tanaka@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+81-3-5555-0143',
    address: '3-2-1 Shibuya',
    city: 'Tokyo',
    state: 'Tokyo',
    postalCode: '150-0002',
    country: 'Japan',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-17T11:50:00Z')
  },
  {
    name: 'Grace Hopper',
    email: 'grace.hopper@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1007',
    address: '707 Grace Ave',
    city: 'Arlington',
    state: 'VA',
    postalCode: '22201',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T21:10:00Z')
  },
  {
    name: 'Henry Cavanaugh',
    email: 'henry.cavanaugh@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1008',
    address: '808 Maple St',
    city: 'Boston',
    state: 'MA',
    postalCode: '02108',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-18T16:35:00Z')
  },
  {
    name: 'Ivy Chen',
    email: 'ivy.chen@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+86-21-5555-0188',
    address: '188 Nanjing Rd',
    city: 'Shanghai',
    state: 'Shanghai',
    postalCode: '200001',
    country: 'China',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T07:15:00Z')
  },
  {
    name: 'Jack Robinson',
    email: 'jack.robinson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+61-2-5555-0121',
    address: '12 Pitt St',
    city: 'Sydney',
    state: 'NSW',
    postalCode: '2000',
    country: 'Australia',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-20T01:30:00Z')
  },
  {
    name: 'Karen Martinez',
    email: 'karen.martinez@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1011',
    address: '303 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90028',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-20T00:55:00Z')
  },
  {
    name: 'Leo Fitzgerald',
    email: 'leo.fitzgerald@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+353-1-555-0142',
    address: '42 Grafton St',
    city: 'Dublin',
    state: 'Leinster',
    postalCode: 'D02 Y765',
    country: 'Ireland',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-18T14:40:00Z')
  },
  {
    name: 'Mia Rossi',
    email: 'mia.rossi@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+39-06-5555-0155',
    address: '55 Via del Corso',
    city: 'Rome',
    state: 'Lazio',
    postalCode: '00186',
    country: 'Italy',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T23:55:00Z')
  },
  {
    name: 'Nathan Wright',
    email: 'nathan.wright@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1014',
    address: '909 Cedar Lane',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-18T10:00:00Z')
  },
  {
    name: 'Olivia Larsen',
    email: 'olivia.larsen@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+45-33-5555-0112',
    address: '12 Nyhavn',
    city: 'Copenhagen',
    state: 'Hovedstaden',
    postalCode: '1051',
    country: 'Denmark',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T06:45:00Z')
  },
  {
    name: 'Peter Parker',
    email: 'peter.parker@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-1016',
    address: '20 Ingram St',
    city: 'Queens',
    state: 'NY',
    postalCode: '11375',
    country: 'United States',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-19T22:30:00Z')
  },
  {
    name: 'Quinn Hughes',
    email: 'quinn.hughes@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-604-555-0133',
    address: '33 Robson St',
    city: 'Vancouver',
    state: 'BC',
    postalCode: 'V6B 3K9',
    country: 'Canada',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-17T15:25:00Z')
  },
  {
    name: 'Rose Campbell',
    email: 'rose.campbell@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-131-555-0197',
    address: '97 Royal Mile',
    city: 'Edinburgh',
    state: 'Scotland',
    postalCode: 'EH1 1RE',
    country: 'United Kingdom',
    shopperType: 'frequent',
    lastLoginAt: new Date('2026-06-20T00:30:00Z')
  },

  // 16 Occasional Shoppers
  {
    name: 'Sam Wilson',
    email: 'sam.wilson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2001',
    address: '44 Shield Ave',
    city: 'Brooklyn',
    state: 'NY',
    postalCode: '11201',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-18T11:20:00Z')
  },
  {
    name: 'Tina Turner',
    email: 'tina.turner@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2002',
    address: '88 Rock Road',
    city: 'Nutbush',
    state: 'TN',
    postalCode: '38063',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-29T10:15:00Z')
  },
  {
    name: 'Victor Vance',
    email: 'victor.vance@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2003',
    address: '11 Broad Street',
    city: 'Philadelphia',
    state: 'PA',
    postalCode: '19107',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-04-12T09:30:00Z')
  },
  {
    name: 'Wendy Darling',
    email: 'wendy.darling@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-20-5555-0104',
    address: '4 Neverland Lane',
    city: 'London',
    state: 'England',
    postalCode: 'W1A 1AA',
    country: 'United Kingdom',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-02T16:00:00Z')
  },
  {
    name: 'Xavier Woods',
    email: 'xavier.woods@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2005',
    address: '55 Wrestling Lane',
    city: 'Atlanta',
    state: 'GA',
    postalCode: '30303',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-06-01T15:45:00Z')
  },
  {
    name: 'Yvonne Craig',
    email: 'yvonne.craig@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2006',
    address: '66 Batgirl Dr',
    city: 'Gotham',
    state: 'NJ',
    postalCode: '07001',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-24T18:00:00Z')
  },
  {
    name: 'Zach Morris',
    email: 'zach.morris@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: false,
    phone: '+1-555-2007',
    address: '77 Bayside Court',
    city: 'Palisades',
    state: 'CA',
    postalCode: '90272',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-06-03T11:45:00Z')
  },
  {
    name: 'Amy Pond',
    email: 'amy.pond@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-141-555-0177',
    address: '77 TARDIS Way',
    city: 'Glasgow',
    state: 'Scotland',
    postalCode: 'G1 1QX',
    country: 'United Kingdom',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-15T12:00:00Z')
  },
  {
    name: 'Ben Tennyson',
    email: 'ben.tennyson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2009',
    address: '99 Omnitrix St',
    city: 'Bellwood',
    state: 'IL',
    postalCode: '60104',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-10T14:50:00Z')
  },
  {
    name: 'Chloe Bourgeois',
    email: 'chloe.bourgeois@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: false,
    phone: '+33-1-5555-0199',
    address: '99 Rue de la Paix',
    city: 'Paris',
    state: 'Île-de-France',
    postalCode: '75002',
    country: 'France',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-30T10:00:00Z')
  },
  {
    name: 'Daniel Larusso',
    email: 'daniel.larusso@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2011',
    address: '11 Miyagi-Do Way',
    city: 'Reseda',
    state: 'CA',
    postalCode: '91335',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-06-08T09:12:00Z')
  },
  {
    name: 'Eva Smith',
    email: 'eva.smith@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-151-555-0112',
    address: '22 Inspector Rd',
    city: 'Brumley',
    state: 'England',
    postalCode: 'BR1 2AB',
    country: 'United Kingdom',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-14T11:55:00Z')
  },
  {
    name: 'George Costanza',
    email: 'george.costanza@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2013',
    address: '13 Vandelay Way',
    city: 'Queens',
    state: 'NY',
    postalCode: '11375',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-06-11T16:30:00Z')
  },
  {
    name: 'Hannah Baker',
    email: 'hannah.baker@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2014',
    address: '14 Clay Street',
    city: 'Crestmont',
    state: 'CA',
    postalCode: '95014',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-04-20T15:20:00Z')
  },
  {
    name: 'Ian Malcolm',
    email: 'ian.malcolm@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2015',
    address: '15 Chaos Dr',
    city: 'Austin',
    state: 'TX',
    postalCode: '78703',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-05-25T14:45:00Z')
  },
  {
    name: 'Julia Roberts',
    email: 'julia.roberts@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-2016',
    address: '16 Rodeo Dr',
    city: 'Beverly Hills',
    state: 'CA',
    postalCode: '90210',
    country: 'United States',
    shopperType: 'occasional',
    lastLoginAt: new Date('2026-06-05T13:10:00Z')
  },

  // 16 Inactive Users
  {
    name: 'Kevin Malone',
    email: 'kevin.malone@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3001',
    address: '11 Paper Road',
    city: 'Scranton',
    state: 'PA',
    postalCode: '18503',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-12-05T10:00:00Z')
  },
  {
    name: 'Laura Palmer',
    email: 'laura.palmer@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: false,
    phone: '+1-555-3002',
    address: '22 Twin Peaks Hwy',
    city: 'Twin Peaks',
    state: 'WA',
    postalCode: '98065',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-10-18T23:30:00Z')
  },
  {
    name: 'Mark Zuckerberg',
    email: 'mark.zuckerberg@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3003',
    address: '33 Meta Lane',
    city: 'Menlo Park',
    state: 'CA',
    postalCode: '94025',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-11-20T15:00:00Z')
  },
  {
    name: 'Nora Valkyrie',
    email: 'nora.valkyrie@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: false,
    phone: '+1-555-3004',
    address: '44 Pancake Blvd',
    city: 'Vale',
    state: 'OR',
    postalCode: '97918',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: undefined
  },
  {
    name: 'Paul Atreides',
    email: 'paul.atreides@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3005',
    address: '55 Spice Road',
    city: 'Arrakeen',
    state: 'NV',
    postalCode: '89001',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-08-01T06:00:00Z')
  },
  {
    name: 'Rachel Green',
    email: 'rachel.green@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3006',
    address: '66 Central Perk Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10011',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2026-01-10T11:40:00Z')
  },
  {
    name: 'Steve Rogers',
    email: 'steve.rogers@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3007',
    address: '1941 Captain St',
    city: 'Brooklyn',
    state: 'NY',
    postalCode: '11201',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-07-04T08:00:00Z')
  },
  {
    name: 'Tracy McConnell',
    email: 'tracy.mcconnell@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3008',
    address: '88 Farhampton Blvd',
    city: 'Farhampton',
    state: 'NY',
    postalCode: '11976',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-09-15T19:30:00Z')
  },
  {
    name: 'Uma Thurman',
    email: 'uma.thurman@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: false,
    phone: '+1-555-3009',
    address: '99 Bride Road',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90046',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: undefined
  },
  {
    name: 'Vince Vega',
    email: 'vince.vega@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3010',
    address: '10 Royale with Cheese Blvd',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90069',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-11-12T22:00:00Z')
  },
  {
    name: 'Will Byers',
    email: 'will.byers@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+1-555-3011',
    address: '11 Upside Down St',
    city: 'Hawkins',
    state: 'IN',
    postalCode: '46319',
    country: 'United States',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-10-31T18:00:00Z')
  },
  {
    name: 'Xena Warrior',
    email: 'xena.warrior@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+30-210-555-0112',
    address: '12 Amphipolis Way',
    city: 'Athens',
    state: 'Attica',
    postalCode: '105 51',
    country: 'Greece',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-05-15T09:00:00Z')
  },
  {
    name: 'Yuri Gagarin',
    email: 'yuri.ganarin@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+7-495-555-0101',
    address: '1 Orbit Way',
    city: 'Moscow',
    state: 'Moscow Oblast',
    postalCode: '141070',
    country: 'Russia',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-04-12T10:07:00Z')
  },
  {
    name: 'Zara Larsson',
    email: 'zara.larsson@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+46-8-5555-0122',
    address: '22 Symphony St',
    city: 'Stockholm',
    state: 'Stockholm',
    postalCode: '111 22',
    country: 'Sweden',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-12-25T20:30:00Z')
  },
  {
    name: 'Arthur Pendragon',
    email: 'arthur.pendragon@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+44-1208-555-0112',
    address: '12 Camelot Court',
    city: 'Cornwall',
    state: 'England',
    postalCode: 'PL31 1AA',
    country: 'United Kingdom',
    shopperType: 'inactive',
    lastLoginAt: undefined
  },
  {
    name: 'Beatrice Portinari',
    email: 'beatrice.portinari@example.com',
    passwordHash: PLACEHOLDER_HASH,
    role: 'customer',
    isEmailVerified: true,
    phone: '+39-055-5555-0131',
    address: '31 Paradiso Blvd',
    city: 'Florence',
    state: 'Tuscany',
    postalCode: '50121',
    country: 'Italy',
    shopperType: 'inactive',
    lastLoginAt: new Date('2025-09-09T09:09:00Z')
  }
];

export const seedUsers = async (shouldExit = true) => {
  try {
    if (!env.mongoUri || env.mongoUri === 'TO_BE_ADDED') {
      console.warn('MONGO_URI is missing or TO_BE_ADDED. Skipping seed.');
      if (shouldExit) process.exit(0);
      return;
    }

    await connectDB();

    console.log('[Users Seed] Cleaning physical dependencies (Address, User docs)...');
    
    // Clean old customer directories/seeded entries
    const customerEmails = rawUsersData.filter(u => u.role === 'customer').map(u => u.email);
    
    // Find all existing seeded users to clean their addresses
    const existingSeededUsers = await User.find({ email: { $in: [...customerEmails, 'admin@example.com'] } });
    const userIds = existingSeededUsers.map(u => u._id);
    
    await Address.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ email: { $in: [...customerEmails, 'admin@example.com'] } });

    console.log(`[Users Seed] Clean up completed. Inserting 1 Admin and 50 robust Customers...`);

    // Prepare complete Mongoose documents
    const savedUsers: IUser[] = [];
    for (const item of rawUsersData) {
      const user = new User({
        name: item.name,
        email: item.email,
        passwordHash: item.passwordHash,
        role: item.role,
        isEmailVerified: item.isEmailVerified,
        phone: item.phone,
        address: item.address,
        city: item.city,
        country: item.country,
        shopperType: item.shopperType,
        lastLoginAt: item.lastLoginAt,
        emailVerifiedAt: item.isEmailVerified ? new Date('2026-01-01T00:00:00Z') : undefined
      });
      const savedUser = await user.save();
      savedUsers.push(savedUser);
    }

    console.log(`[Users Seed] Successfully inserted ${savedUsers.length} User documents!`);

    // Also link the Address documents for each customer beautifully
    const addressDocs: any[] = [];
    for (const user of savedUsers) {
      const originItem = rawUsersData.find(u => u.email === user.email);
      if (originItem && originItem.address) {
        addressDocs.push({
          user: user._id,
          fullName: user.name,
          phone: originItem.phone || '+1-555-0000',
          addressLine1: originItem.address,
          city: originItem.city || 'Default City',
          state: originItem.state || 'Default State',
          postalCode: originItem.postalCode || '10000',
          country: originItem.country || 'United States',
          isDefault: true
        });
      }
    }

    if (addressDocs.length > 0) {
      const insertedAddresses = await Address.insertMany(addressDocs);
      console.log(`[Users Seed] Successfully generated and linked ${insertedAddresses.length} default Address documents!`);
    }

    console.log('[Users Seed] Seeding operation finished flawlessly.');

    if (shouldExit) process.exit(0);
  } catch (error: any) {
    console.error('[Users Seed] Seeding failed:', error.message || error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].includes('seedUsers')) {
  seedUsers(true);
}
