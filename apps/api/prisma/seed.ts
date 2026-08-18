/**
 * Development seed: 10 published sample restaurants around KU, Dhulikhel,
 * plus one DRAFT (must never appear in public endpoints).
 *
 * NOTE: names, menus, prices, and coordinates are realistic placeholders —
 * they are replaced by on-the-ground data collection before launch (blueprint §1).
 */
import { PrismaClient, type ImageType, type PriceBand } from '@prisma/client';

import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

// ————————————————————————————————— helpers

/** hh:mm → minutes from midnight */
const t = (hh: number, mm = 0) => hh * 60 + mm;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface HourSpec {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
}

const everyday = (open: number, close: number): HourSpec[] =>
  ALL_DAYS.map((d) => ({ dayOfWeek: d, opensAt: open, closesAt: close }));

const everydayExcept = (closedDay: number, open: number, close: number): HourSpec[] =>
  ALL_DAYS.filter((d) => d !== closedDay).map((d) => ({
    dayOfWeek: d,
    opensAt: open,
    closesAt: close,
  }));

const splitEveryday = (a: [number, number], b: [number, number]): HourSpec[] =>
  ALL_DAYS.flatMap((d) => [
    { dayOfWeek: d, opensAt: a[0], closesAt: a[1] },
    { dayOfWeek: d, opensAt: b[0], closesAt: b[1] },
  ]);

const img = (seedKey: string, alt: string, type: ImageType = 'GALLERY', sortOrder = 0) => ({
  url: `https://picsum.photos/seed/${seedKey}/1200/750`,
  alt,
  type,
  sortOrder,
  width: 1200,
  height: 750,
});

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

interface MenuItemSpec {
  name: string;
  priceNpr: number;
  description?: string;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isAvailable?: boolean;
}

interface MenuSpec {
  name: string;
  items: MenuItemSpec[];
}

interface ReviewSpec {
  rating: number;
  body: string;
  authorName?: string;
  daysAgo: number;
  helpfulCount?: number;
}

interface RestaurantSpec {
  slug: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  priceBand: PriceBand;
  priceMinNpr: number;
  priceMaxNpr: number;
  categories: string[];
  hasQrPayment?: boolean;
  hasDelivery?: boolean;
  hasVegOptions?: boolean;
  isFeatured?: boolean;
  featuredRank?: number;
  hours: HourSpec[];
  menu: MenuSpec[];
  reviews: ReviewSpec[];
  extraImages?: ReturnType<typeof img>[];
  createdDaysAgo: number;
}

// ————————————————————————————————— data

const CATEGORIES = [
  { slug: 'momo', name: 'Momo', icon: 'soup', sortOrder: 1 },
  { slug: 'thakali', name: 'Thakali', icon: 'utensils', sortOrder: 2 },
  { slug: 'nepali-khana', name: 'Nepali Khana', icon: 'cooking-pot', sortOrder: 3 },
  { slug: 'cafe', name: 'Café', icon: 'coffee', sortOrder: 4 },
  { slug: 'chiya', name: 'Chiya', icon: 'cup-soda', sortOrder: 5 },
  { slug: 'bakery', name: 'Bakery', icon: 'croissant', sortOrder: 6 },
  { slug: 'fast-food', name: 'Fast Food', icon: 'sandwich', sortOrder: 7 },
  { slug: 'sekuwa', name: 'Sekuwa', icon: 'flame', sortOrder: 8 },
  { slug: 'dessert', name: 'Dessert', icon: 'cake-slice', sortOrder: 9 },
];

const RESTAURANTS: RestaurantSpec[] = [
  {
    slug: 'himalayan-momo-house',
    name: 'Himalayan Momo House',
    description:
      'The go-to momo spot right outside the KU gate. Steam rises from dawn till dusk — jhol momo drowned in sesame-tomato broth is the house specialty, and portions are made for student budgets.',
    address: 'KU Gate Road, Dhulikhel',
    latitude: 27.6201,
    longitude: 85.5389,
    phone: '+977-9841-000001',
    priceBand: 'BUDGET',
    priceMinNpr: 60,
    priceMaxNpr: 220,
    categories: ['momo', 'fast-food'],
    hasQrPayment: true,
    hasDelivery: true,
    hasVegOptions: true,
    isFeatured: true,
    featuredRank: 1,
    hours: everyday(t(10), t(20)),
    createdDaysAgo: 210,
    menu: [
      {
        name: 'Momo',
        items: [
          { name: 'Steam Momo (Veg)', priceNpr: 120, isVegetarian: true },
          { name: 'Steam Momo (Chicken)', priceNpr: 160, isPopular: true },
          {
            name: 'Jhol Momo',
            priceNpr: 180,
            description: 'Served swimming in warm sesame–tomato jhol',
            isPopular: true,
          },
          { name: 'Kothey Momo', priceNpr: 170, isPopular: true },
          { name: 'Chilli Momo', priceNpr: 200 },
        ],
      },
      {
        name: 'Drinks',
        items: [
          { name: 'Milk Tea', priceNpr: 30, isVegetarian: true },
          { name: 'Lassi', priceNpr: 90, isVegetarian: true },
          { name: 'Coke', priceNpr: 60, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Jhol momo here got me through finals week. Broth is warm, spicy and they never skimp on the achar.',
        authorName: 'Sujal',
        daysAgo: 12,
        helpfulCount: 14,
      },
      {
        rating: 5,
        body: 'Best value near the gate. Ten pieces, full plate, Rs. 160. Nothing else to say.',
        daysAgo: 30,
        helpfulCount: 8,
      },
      {
        rating: 4,
        body: 'Really good kothey but expect a wait after 5pm — the whole campus shows up.',
        authorName: 'Prerana',
        daysAgo: 45,
        helpfulCount: 5,
      },
      { rating: 4, body: 'Solid steam momo. The chilli momo is HOT, be warned.', daysAgo: 70 },
      {
        rating: 5,
        body: 'Owner remembers regulars and their orders. Feels like home.',
        authorName: 'Bibek',
        daysAgo: 95,
        helpfulCount: 3,
      },
    ],
    extraImages: [
      img('himalayan-momo-2', 'Plate of jhol momo', 'GALLERY', 1),
      img('himalayan-momo-3', 'Interior seating area', 'GALLERY', 2),
    ],
  },
  {
    slug: 'ku-gate-chiya-pasal',
    name: 'KU Gate Chiya Pasal',
    description:
      'A classic morning-and-evening chiya stop steps from the university gate. Sel roti fried fresh at sunrise, milk tea at Rs. 25, and the best campus gossip in Dhulikhel.',
    address: 'KU Gate, Dhulikhel',
    latitude: 27.6198,
    longitude: 85.5382,
    priceBand: 'BUDGET',
    priceMinNpr: 15,
    priceMaxNpr: 60,
    categories: ['chiya'],
    hasQrPayment: true,
    hours: splitEveryday([t(6), t(11)], [t(15), t(19, 30)]),
    createdDaysAgo: 400,
    menu: [
      {
        name: 'Chiya',
        items: [
          { name: 'Milk Tea', priceNpr: 25, isPopular: true, isVegetarian: true },
          { name: 'Black Tea', priceNpr: 20, isVegetarian: true },
          { name: 'Masala Tea', priceNpr: 40, isVegetarian: true },
          { name: 'Lemon Tea', priceNpr: 30, isVegetarian: true },
        ],
      },
      {
        name: 'Nasta',
        items: [
          { name: 'Sel Roti', priceNpr: 25, isPopular: true, isVegetarian: true },
          { name: 'Samosa', priceNpr: 35, isVegetarian: true },
          { name: 'Pakoda', priceNpr: 60, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Morning sel roti + chiya before 8am class is a ritual at this point.',
        authorName: 'Anisha',
        daysAgo: 8,
        helpfulCount: 9,
      },
      {
        rating: 4,
        body: 'Cheap, fast, always crowded. Closed mid-day so plan around it.',
        daysAgo: 25,
      },
      {
        rating: 5,
        body: 'Aunty makes the strongest masala chiya near campus. Rs. 40 well spent.',
        daysAgo: 60,
        helpfulCount: 4,
      },
      { rating: 4, body: 'Great tea, limited seating. Takeaway cups available.', daysAgo: 90 },
    ],
  },
  {
    slug: 'dhulikhel-thakali-bhancha',
    name: 'Dhulikhel Thakali Bhancha',
    description:
      'Proper Thakali khana sets with unlimited dal, bhat and saag refills, ghee-heavy and generous. The walk toward old town is worth it for the mutton set alone.',
    address: 'B.P. Highway, Dhulikhel Bazaar',
    latitude: 27.6242,
    longitude: 85.5427,
    phone: '+977-11-490002',
    priceBand: 'STANDARD',
    priceMinNpr: 80,
    priceMaxNpr: 520,
    categories: ['thakali', 'nepali-khana'],
    hasQrPayment: true,
    hasDelivery: true,
    hasVegOptions: true,
    isFeatured: true,
    featuredRank: 2,
    hours: everyday(t(10, 30), t(21)),
    createdDaysAgo: 350,
    menu: [
      {
        name: 'Khana Set',
        items: [
          {
            name: 'Veg Thakali Set',
            priceNpr: 280,
            description: 'Dal, bhat, saag, aloo, gundruk, papad — refills included',
            isPopular: true,
            isVegetarian: true,
          },
          { name: 'Chicken Thakali Set', priceNpr: 420, isPopular: true },
          { name: 'Mutton Thakali Set', priceNpr: 520 },
        ],
      },
      {
        name: 'Sides',
        items: [
          { name: 'Aloo Jeera', priceNpr: 120, isVegetarian: true },
          { name: 'Saag', priceNpr: 80, isVegetarian: true },
          { name: 'Gundruk Sadeko', priceNpr: 110, isVegetarian: true },
          { name: 'Papad', priceNpr: 30, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Brought my parents here on visiting day. Mutton set is the real deal — soft, gravy rich, refills generous.',
        authorName: 'Kritika',
        daysAgo: 15,
        helpfulCount: 11,
      },
      { rating: 5, body: 'Unlimited dal bhat refills. Enough said.', daysAgo: 40, helpfulCount: 7 },
      {
        rating: 4,
        body: 'Veg set is great value at 280. Slightly slow when a bus tour lands.',
        authorName: 'Rohan',
        daysAgo: 55,
      },
      {
        rating: 5,
        body: 'Ghee on hot rice, gundruk on the side. Home food, honestly.',
        daysAgo: 80,
        helpfulCount: 2,
      },
      {
        rating: 4,
        body: 'Good, filling, honest food. Delivery to hostel took ~40 min.',
        daysAgo: 120,
      },
      {
        rating: 5,
        body: 'The saag refill aunty is the MVP of Dhulikhel.',
        daysAgo: 160,
        helpfulCount: 6,
      },
    ],
    extraImages: [img('thakali-set-2', 'Thakali khana set with brass plates', 'GALLERY', 1)],
  },
  {
    slug: 'old-bazaar-sekuwa-corner',
    name: 'Old Bazaar Sekuwa Corner',
    description:
      'Charcoal-grilled sekuwa in the old town, served evening till past midnight. Smoke, spice, chiura and cold drinks — the classic Friday-night plan.',
    address: 'Old Bazaar, Dhulikhel',
    latitude: 27.6251,
    longitude: 85.544,
    phone: '+977-9803-000004',
    priceBand: 'STANDARD',
    priceMinNpr: 40,
    priceMaxNpr: 450,
    categories: ['sekuwa'],
    hasQrPayment: true,
    hours: everyday(t(17), t(24, 30)), // closes 00:30 — past midnight
    createdDaysAgo: 300,
    menu: [
      {
        name: 'Sekuwa',
        items: [
          { name: 'Pork Sekuwa', priceNpr: 350, isPopular: true },
          { name: 'Chicken Sekuwa', priceNpr: 320, isPopular: true },
          { name: 'Mutton Sekuwa', priceNpr: 450 },
        ],
      },
      {
        name: 'Sides',
        items: [
          { name: 'Bhatmas Sadeko', priceNpr: 120, isVegetarian: true },
          { name: 'Chiura', priceNpr: 40, isVegetarian: true },
          { name: 'Aloo Achar', priceNpr: 90, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Open till 12:30 which saves lives after late lab sessions. Pork sekuwa straight off the coals.',
        authorName: 'Nishan',
        daysAgo: 10,
        helpfulCount: 12,
      },
      { rating: 4, body: 'Smoky, spicy, perfect with chiura. Gets loud on weekends.', daysAgo: 35 },
      {
        rating: 5,
        body: 'The bhatmas sadeko alone is worth the walk to old bazaar.',
        daysAgo: 65,
        helpfulCount: 3,
      },
      {
        rating: 4,
        body: 'Great grill game. Cash was king here until they added QR — thank god.',
        daysAgo: 100,
      },
    ],
  },
  {
    slug: 'campus-bites',
    name: 'Campus Bites',
    description:
      'Quick chowmein, burgers and fries below the gate — the between-classes refuel spot. Nothing fancy, everything fast, most things under Rs. 200.',
    address: 'KU Road, below main gate, Dhulikhel',
    latitude: 27.6188,
    longitude: 85.5379,
    phone: '+977-9860-000005',
    priceBand: 'BUDGET',
    priceMinNpr: 60,
    priceMaxNpr: 220,
    categories: ['fast-food'],
    hasQrPayment: true,
    hasDelivery: true,
    hours: everyday(t(9), t(20, 30)),
    createdDaysAgo: 150,
    menu: [
      {
        name: 'Snacks',
        items: [
          { name: 'Veg Chowmein', priceNpr: 130, isPopular: true, isVegetarian: true },
          { name: 'Chicken Burger', priceNpr: 180, isPopular: true },
          { name: 'French Fries', priceNpr: 120, isVegetarian: true },
          { name: 'Sausage', priceNpr: 100 },
        ],
      },
      {
        name: 'Drinks',
        items: [
          { name: 'Cold Coffee', priceNpr: 150, isVegetarian: true },
          { name: 'Soft Drink', priceNpr: 60, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 4,
        body: 'Chowmein in under 10 minutes between classes. Does the job every time.',
        daysAgo: 20,
        helpfulCount: 4,
      },
      {
        rating: 3,
        body: 'Burger is decent for 180 but the bun was dry last visit.',
        authorName: 'Sneha',
        daysAgo: 50,
      },
      {
        rating: 4,
        body: 'Cheap, fast, reliable. Delivery to the hostel gate actually works.',
        daysAgo: 85,
        helpfulCount: 2,
      },
    ],
  },
  {
    slug: 'aroma-cafe-bakery',
    name: 'Aroma Café & Bakery',
    description:
      'Fresh croissants and proper espresso a short walk from the gate. Quiet corners, plug points everywhere, and cake displays that make studying difficult.',
    address: 'KU Gate Road, Dhulikhel',
    latitude: 27.621,
    longitude: 85.5395,
    phone: '+977-11-490006',
    priceBand: 'STANDARD',
    priceMinNpr: 90,
    priceMaxNpr: 320,
    categories: ['cafe', 'bakery'],
    hasQrPayment: true,
    hasVegOptions: true,
    isFeatured: true,
    featuredRank: 3,
    hours: everyday(t(7, 30), t(19, 30)),
    createdDaysAgo: 180,
    menu: [
      {
        name: 'Coffee',
        items: [
          { name: 'Espresso', priceNpr: 140, isVegetarian: true },
          { name: 'Cappuccino', priceNpr: 200, isPopular: true, isVegetarian: true },
          { name: 'Latte', priceNpr: 220, isVegetarian: true },
          { name: 'Hot Chocolate', priceNpr: 250, isVegetarian: true },
        ],
      },
      {
        name: 'Bakery',
        items: [
          { name: 'Butter Croissant', priceNpr: 160, isPopular: true, isVegetarian: true },
          { name: 'Chocolate Cake (slice)', priceNpr: 220, isVegetarian: true },
          { name: 'Cinnamon Roll', priceNpr: 180, isVegetarian: true },
          { name: 'Brownie', priceNpr: 150, isVegetarian: true, isAvailable: false },
        ],
      },
      {
        name: 'Breakfast',
        items: [
          { name: 'Pancakes with Honey', priceNpr: 280, isVegetarian: true },
          { name: 'Eggs & Toast', priceNpr: 250 },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'My thesis was basically written at the corner table. Good wifi, better cappuccino.',
        authorName: 'Aayusha',
        daysAgo: 5,
        helpfulCount: 10,
      },
      {
        rating: 4,
        body: 'Croissants sell out by noon on weekends. You have been warned.',
        daysAgo: 28,
        helpfulCount: 5,
      },
      { rating: 5, body: 'The only place near KU that gets espresso right.', daysAgo: 62 },
      {
        rating: 4,
        body: 'A bit pricier than campus canteen but the quality gap is real.',
        authorName: 'Dipesh',
        daysAgo: 98,
      },
      {
        rating: 4,
        body: 'Cinnamon roll + americano = perfect Saturday morning.',
        daysAgo: 130,
        helpfulCount: 1,
      },
    ],
    extraImages: [
      img('aroma-cafe-2', 'Espresso machine and pastry counter', 'GALLERY', 1),
      img('aroma-menu-scan', 'Photographed physical menu board', 'MENU_SCAN', 0),
    ],
  },
  {
    slug: 'peace-garden-restaurant',
    name: 'Peace Garden Restaurant',
    description:
      'Garden seating with a Dhulikhel valley view, serving dal bhat, khaja sets and Newari plates. The group-dinner default when someone passes an exam or a birthday hits.',
    address: 'Araniko Highway, Dhulikhel',
    latitude: 27.6225,
    longitude: 85.541,
    phone: '+977-11-490007',
    priceBand: 'STANDARD',
    priceMinNpr: 90,
    priceMaxNpr: 380,
    categories: ['nepali-khana'],
    hasDelivery: true,
    hasVegOptions: true,
    hours: everyday(t(10), t(21, 30)),
    createdDaysAgo: 260,
    menu: [
      {
        name: 'Khana',
        items: [
          { name: 'Dal Bhat (Veg)', priceNpr: 250, isPopular: true, isVegetarian: true },
          { name: 'Dal Bhat (Chicken)', priceNpr: 380, isPopular: true },
        ],
      },
      {
        name: 'Khaja',
        items: [
          { name: 'Chatamari', priceNpr: 150 },
          { name: 'Sukuti Sadeko', priceNpr: 220 },
          { name: 'Wai Wai Sadeko', priceNpr: 90, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 4,
        body: 'Garden seating at sunset is unbeatable. Food is good, view is better.',
        authorName: 'Prakriti',
        daysAgo: 18,
        helpfulCount: 6,
      },
      {
        rating: 4,
        body: 'Hosted our whole batch farewell here. Handled 30 people without collapsing.',
        daysAgo: 44,
        helpfulCount: 8,
      },
      {
        rating: 3,
        body: 'Food took 45 minutes on a packed Saturday. Taste made up for it, mostly.',
        daysAgo: 75,
      },
      {
        rating: 5,
        body: 'Sukuti sadeko + valley view + good company. Perfect evening.',
        daysAgo: 110,
        helpfulCount: 2,
      },
    ],
  },
  {
    slug: 'everest-view-family-restaurant',
    name: 'Everest View Family Restaurant',
    description:
      'The dress-up option: sizzlers, grills and paneer momo with white-tablecloth service and Himalayan views on clear mornings. Where visiting parents get taken.',
    address: 'Dhulikhel View Point Road',
    latitude: 27.626,
    longitude: 85.5455,
    phone: '+977-11-490008',
    priceBand: 'PREMIUM',
    priceMinNpr: 100,
    priceMaxNpr: 650,
    categories: ['nepali-khana', 'momo', 'dessert'],
    hasQrPayment: true,
    hasVegOptions: true,
    hours: everyday(t(11), t(21)),
    createdDaysAgo: 320,
    menu: [
      {
        name: 'Mains',
        items: [
          { name: 'Chicken Sizzler', priceNpr: 650, isPopular: true },
          { name: 'Grilled Chicken', priceNpr: 550 },
          { name: 'Fish Curry', priceNpr: 480 },
        ],
      },
      {
        name: 'Momo',
        items: [
          { name: 'Buff Momo', priceNpr: 200 },
          { name: 'Paneer Momo', priceNpr: 220, isVegetarian: true },
        ],
      },
      {
        name: 'Desserts',
        items: [
          { name: 'Ice Cream', priceNpr: 120, isVegetarian: true },
          { name: 'Gulab Jamun', priceNpr: 100, isPopular: true, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Took my parents here — sizzler arrived dramatic and delicious. Views were clear that day too.',
        authorName: 'Sandesh',
        daysAgo: 22,
        helpfulCount: 7,
      },
      {
        rating: 4,
        body: 'Premium for Dhulikhel but the quality holds up. Paneer momo surprisingly great.',
        daysAgo: 58,
      },
      {
        rating: 2,
        body: 'Service was slow and my order came out cold on a busy holiday. Expected more at these prices.',
        daysAgo: 88,
        helpfulCount: 3,
      },
      {
        rating: 5,
        body: 'Best gulab jamun in town, and I have done the research.',
        authorName: 'Ishani',
        daysAgo: 125,
        helpfulCount: 4,
      },
    ],
  },
  {
    slug: 'green-leaf-veg-corner',
    name: 'Green Leaf Veg Corner',
    description:
      'Pure vegetarian khana and khaja at student prices. Simple, clean, and the paneer curry punches far above Rs. 220. Closed Saturdays.',
    address: 'Hospital Road, Dhulikhel',
    latitude: 27.6218,
    longitude: 85.5375,
    priceBand: 'BUDGET',
    priceMinNpr: 60,
    priceMaxNpr: 220,
    categories: ['nepali-khana'],
    hasQrPayment: true,
    hasVegOptions: true,
    hours: everydayExcept(6, t(9), t(19)),
    createdDaysAgo: 90,
    menu: [
      {
        name: 'Veg Khana',
        items: [
          { name: 'Veg Khana Set', priceNpr: 180, isPopular: true, isVegetarian: true },
          { name: 'Paneer Curry', priceNpr: 220, isPopular: true, isVegetarian: true },
          { name: 'Veg Pulau', priceNpr: 160, isVegetarian: true },
          { name: 'Curd', priceNpr: 60, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'As a vegetarian this place is a blessing. Khana set at 180 is unreal value.',
        authorName: 'Shristi',
        daysAgo: 14,
        helpfulCount: 9,
      },
      {
        rating: 4,
        body: 'Clean kitchen, honest food. Remember they are closed Saturdays!',
        daysAgo: 42,
        helpfulCount: 3,
      },
      { rating: 4, body: 'Paneer curry with pulau is my weekly treat.', daysAgo: 77 },
    ],
  },
  {
    slug: 'mountain-brew-coffee',
    name: 'Mountain Brew Coffee',
    description:
      'Specialty coffee below the gate — beans roasted in Kathmandu, cold brew on tap in summer, and a cheesecake with a campus-wide fanbase.',
    address: 'KU Road, Dhulikhel',
    latitude: 27.618,
    longitude: 85.537,
    phone: '+977-9818-000010',
    priceBand: 'STANDARD',
    priceMinNpr: 90,
    priceMaxNpr: 320,
    categories: ['cafe', 'dessert'],
    hasQrPayment: true,
    hours: everyday(t(8), t(20)),
    createdDaysAgo: 45,
    menu: [
      {
        name: 'Coffee',
        items: [
          { name: 'Americano', priceNpr: 160, isVegetarian: true },
          { name: 'Flat White', priceNpr: 240, isPopular: true, isVegetarian: true },
          { name: 'Cold Brew', priceNpr: 280, isVegetarian: true },
          { name: 'Mocha', priceNpr: 260, isVegetarian: true },
        ],
      },
      {
        name: 'Dessert',
        items: [
          { name: 'Blueberry Cheesecake', priceNpr: 320, isPopular: true, isVegetarian: true },
          { name: 'Chocolate Chip Cookie', priceNpr: 90, isVegetarian: true },
        ],
      },
    ],
    reviews: [
      {
        rating: 5,
        body: 'Finally, real specialty coffee in Dhulikhel. The flat white is Kathmandu-tier.',
        authorName: 'Aarav',
        daysAgo: 6,
        helpfulCount: 8,
      },
      {
        rating: 5,
        body: 'Cheesecake sells out by evening. Go early, thank me later.',
        daysAgo: 19,
        helpfulCount: 6,
      },
      {
        rating: 4,
        body: 'Cold brew on a hot day after class — elite. Slightly pricey for daily visits.',
        daysAgo: 33,
      },
      {
        rating: 5,
        body: 'New favorite study spot. Calm music, fast wifi, great beans.',
        authorName: 'Merina',
        daysAgo: 40,
        helpfulCount: 2,
      },
      {
        rating: 4,
        body: 'Mocha is rich without being sugary. Solid new addition near the gate.',
        daysAgo: 44,
      },
    ],
    extraImages: [img('mountain-brew-2', 'Barista pouring a flat white', 'GALLERY', 1)],
  },
];

const DRAFT_RESTAURANT: RestaurantSpec = {
  slug: 'riverside-grill',
  name: 'Riverside Grill',
  description: 'Opening soon — grills and platters by the Punyamata khola.',
  address: 'Riverside, Dhulikhel',
  latitude: 27.617,
  longitude: 85.548,
  priceBand: 'STANDARD',
  priceMinNpr: 200,
  priceMaxNpr: 600,
  categories: ['sekuwa'],
  hours: [],
  menu: [],
  reviews: [],
  createdDaysAgo: 2,
};

const SITE_SETTINGS: { key: string; value: object }[] = [
  {
    key: 'hero_content',
    value: {
      headline: 'Every great bite around KU.',
      subheadline:
        'Menus, prices, and honest student reviews for every restaurant near Kathmandu University.',
      searchPlaceholder: 'Search momo, cafés, thakali…',
    },
  },
  {
    key: 'popular_searches',
    value: ['momo', 'chiya', 'thakali set', 'coffee', 'sekuwa', 'burger'],
  },
  {
    key: 'faq',
    value: [
      {
        question: 'Is KU Food Hunt free to use?',
        answer:
          'Completely free, no account needed. Browse every restaurant, menu and review without signing up.',
      },
      {
        question: 'How accurate are the menus and prices?',
        answer:
          'Our team collects and updates them directly from the restaurants. Spotted something outdated? Use the suggest link in the footer.',
      },
      {
        question: 'Can I write a review without an account?',
        answer:
          'Yes — rate, write and add photos anonymously or with your name. Reviews are moderated for spam only.',
      },
      {
        question: 'How does "Open Now" work?',
        answer:
          "We track each restaurant's weekly hours, including split shifts and late closings, computed in Nepal time.",
      },
      {
        question: 'Can restaurant owners edit their listings?',
        answer:
          'Not directly — listings are curated by the KU Food Hunt team to keep information consistent and trustworthy.',
      },
    ],
  },
  {
    key: 'testimonials',
    value: [
      {
        quote: 'Found my regular momo spot in my first week at KU thanks to this.',
        author: 'Aashish',
        detail: 'Computer Engineering, 1st year',
      },
      {
        quote: "The price filters are a broke student's best friend.",
        author: 'Nikita',
        detail: 'Pharmacy, 3rd year',
      },
      {
        quote: 'We plan every batch dinner with the map. It just works.',
        author: 'Saugat',
        detail: 'Civil Engineering, 4th year',
      },
    ],
  },
];

// ————————————————————————————————— seed

async function createRestaurant(
  spec: RestaurantSpec,
  catId: Record<string, string>,
  draft = false,
) {
  const createdAt = daysAgo(spec.createdDaysAgo);

  const restaurant = await prisma.restaurant.create({
    data: {
      slug: spec.slug,
      name: spec.name,
      description: spec.description,
      address: spec.address,
      latitude: spec.latitude,
      longitude: spec.longitude,
      phone: spec.phone ?? null,
      priceBand: spec.priceBand,
      priceMinNpr: spec.priceMinNpr,
      priceMaxNpr: spec.priceMaxNpr,
      hasQrPayment: spec.hasQrPayment ?? false,
      hasDelivery: spec.hasDelivery ?? false,
      hasVegOptions: spec.hasVegOptions ?? false,
      status: draft ? 'DRAFT' : 'PUBLISHED',
      isFeatured: spec.isFeatured ?? false,
      featuredRank: spec.featuredRank ?? null,
      createdAt,
      categories: {
        create: spec.categories.map((slug) => ({
          category: { connect: { id: catId[slug] } },
        })),
      },
      openingHours: { create: spec.hours },
      images: {
        create: [
          img(spec.slug, `${spec.name} — cover photo`, 'COVER', 0),
          ...(spec.extraImages ?? []),
        ],
      },
    },
  });

  for (const [mcIndex, mc] of spec.menu.entries()) {
    const menuCategory = await prisma.menuCategory.create({
      data: { restaurantId: restaurant.id, name: mc.name, sortOrder: mcIndex },
    });
    await prisma.menuItem.createMany({
      data: mc.items.map((item, i) => ({
        menuCategoryId: menuCategory.id,
        restaurantId: restaurant.id,
        name: item.name,
        description: item.description ?? null,
        priceNpr: item.priceNpr,
        isPopular: item.isPopular ?? false,
        isVegetarian: item.isVegetarian ?? false,
        isAvailable: item.isAvailable ?? true,
        sortOrder: i,
      })),
    });
  }

  if (spec.reviews.length > 0) {
    await prisma.review.createMany({
      data: spec.reviews.map((r) => ({
        restaurantId: restaurant.id,
        authorName: r.authorName ?? null,
        rating: r.rating,
        body: r.body,
        helpfulCount: r.helpfulCount ?? 0,
        createdAt: daysAgo(r.daysAgo),
      })),
    });

    const avg = spec.reviews.reduce((sum, r) => sum + r.rating, 0) / spec.reviews.length;
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { avgRating: Math.round(avg * 10) / 10, reviewCount: spec.reviews.length },
    });
  }

  return restaurant;
}

/**
 * This seed is destructive: it deletes every restaurant (cascading to hours,
 * images, menus, reviews and pending partner submissions), every category, and
 * every site setting before writing sample data.
 *
 * Guarding on NODE_ENV does not work here. This file imports neither dotenv nor
 * src/config/env, and the Prisma CLI only reads .env for DATABASE_URL — so
 * NODE_ENV is undefined during a normal `pnpm db:seed` no matter which database
 * DATABASE_URL points at. Instead, ask the database itself whether it already
 * holds real data, which is true exactly when it matters.
 */
async function assertSafeToWipe(): Promise<void> {
  if (process.env.SEED_CONFIRM_DESTRUCTIVE === 'yes') return;

  const [restaurants, reviews] = await Promise.all([
    prisma.restaurant.count(),
    prisma.review.count(),
  ]);
  if (restaurants === 0 && reviews === 0) return;

  throw new Error(
    `Refusing to seed: this database already holds ${restaurants} restaurant(s) and ` +
      `${reviews} review(s), and seeding deletes all of them.\n` +
      `  If that is genuinely what you want, re-run with SEED_CONFIRM_DESTRUCTIVE=yes.\n` +
      `  To only create or update the admin account, run scripts/create-admins.ts instead.`,
  );
}

async function main() {
  await assertSafeToWipe();

  console.log('Clearing existing data…');
  await prisma.restaurant.deleteMany(); // cascades to hours/images/menu/reviews
  await prisma.category.deleteMany();
  await prisma.siteSetting.deleteMany();

  console.log('Creating categories…');
  const catId: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: c });
    catId[created.slug] = created.id;
  }

  console.log('Creating restaurants…');
  for (const spec of RESTAURANTS) {
    await createRestaurant(spec, catId);
  }
  await createRestaurant(DRAFT_RESTAURANT, catId, true);

  console.log('Creating site settings…');
  for (const s of SITE_SETTINGS) {
    await prisma.siteSetting.create({ data: s });
  }

  console.log('Ensuring admin account…');
  // No default email and no fallback password: a publicly-known credential must
  // never be created. Provisioning an admin is an explicit, opt-in action —
  // supply BOTH ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD, or no admin is created.
  // Existing accounts are only created-if-missing, never password-reset here, so
  // the accounts provisioned out-of-band keep their own passwords.
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      '  skipped — set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to provision an admin. ' +
        'No default/public admin account is ever created.',
    );
  } else {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {}, // never silently reset an existing account's password
      create: {
        email: adminEmail.toLowerCase(),
        name: 'KU Food Hunt Admin',
        role: 'SUPERADMIN',
        passwordHash,
      },
    });
    console.log(`  admin ensured → ${adminEmail.toLowerCase()}`);
  }

  const counts = {
    restaurants: await prisma.restaurant.count(),
    published: await prisma.restaurant.count({ where: { status: 'PUBLISHED' } }),
    menuItems: await prisma.menuItem.count(),
    reviews: await prisma.review.count(),
    categories: await prisma.category.count(),
    admins: await prisma.admin.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
