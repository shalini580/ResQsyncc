// Demo data, only inserted when the users table is empty.
import bcrypt from 'bcryptjs';
import { resQuery, resOne } from './resDb.js';
import { RES_ZONES, RES_UNITS } from './resConfig.js';
import { resCreateCase, resCreateRequest, resSqlTime, resNotify } from './resRecords.js';

const resMinutesAgo = (resMin) => resSqlTime(new Date(Date.now() - resMin * 60000));
const resHoursLater = (resH) => resSqlTime(new Date(Date.now() + resH * 3600000));

const RES_USERS = [
  { name: 'Demo City Controller', email: 'admin@example.invalid', passwordEnv: 'RESQSYNC_SEED_ADMIN_PASSWORD', role: 'admin', zone: 'Zone A' },
  { name: 'Demo NGO One', email: 'ngo1@example.invalid', passwordEnv: 'RESQSYNC_SEED_SHANTI_PASSWORD', role: 'ngo', zone: 'Zone B',
    org: ['Demo Relief Shelter', 'Emergency Shelter', 'Zone B', 150, 'verified'] },
  { name: 'Demo NGO Two', email: 'ngo2@example.invalid', passwordEnv: 'RESQSYNC_SEED_HOPE_PASSWORD', role: 'ngo', zone: 'Zone A',
    org: ['Demo Relief Group', 'NGO', 'Zone A', 200, 'verified'] },
  { name: 'Demo NGO Three', email: 'ngo3@example.invalid', passwordEnv: 'RESQSYNC_SEED_SEVA_PASSWORD', role: 'ngo', zone: 'Zone C',
    org: ['Demo Community Kitchen', 'Community Kitchen', 'Zone C', 120, 'pending'] },
  { name: 'Demo Restaurant One', email: 'restaurant1@example.invalid', passwordEnv: 'RESQSYNC_SEED_MARCUS_PASSWORD', role: 'restaurant', zone: 'Zone A',
    org: ['Demo Central Kitchen', 'Restaurant', 'Zone A', 300, 'verified'] },
  { name: 'Demo Restaurant Two', email: 'restaurant2@example.invalid', passwordEnv: 'RESQSYNC_SEED_ANITA_PASSWORD', role: 'restaurant', zone: 'Zone B',
    org: ['Demo Garden Kitchen', 'Restaurant', 'Zone B', 80, 'pending'] },
  { name: 'Demo Volunteer One', email: 'volunteer1@example.invalid', passwordEnv: 'RESQSYNC_SEED_ALEX_PASSWORD', role: 'volunteer', zone: 'Zone A',
    vol: ['First aid, water rescue, logistics', 480, 120, 'Silver Vanguard', 14] },
  { name: 'Demo Volunteer Two', email: 'volunteer2@example.invalid', passwordEnv: 'RESQSYNC_SEED_PRIYA_PASSWORD', role: 'volunteer', zone: 'Zone B',
    vol: ['First aid and logistics', 120, 40, 'Bronze Responder', 3] },
];

// food, water, medicine, cots, vehicles - Zone D is short on purpose
const RES_STOCK = {
  'Zone A': [400, 500, 150, 200, 12],
  'Zone B': [300, 350, 100, 150, 8],
  'Zone C': [250, 300, 80, 120, 6],
  'Zone D': [60, 80, 20, 30, 2],
};

export async function resSeed() {
  const resCount = await resOne('SELECT COUNT(*) AS n FROM users');
  if (Number(resCount.n) > 0) return;
  console.log('[db] Empty database - adding demo data');

  const resMissingPasswords = RES_USERS.filter((resU) => !process.env[resU.passwordEnv]);
  if (resMissingPasswords.length) {
    throw new Error(`Set seed account passwords in the environment: ${resMissingPasswords.map((resU) => resU.passwordEnv).join(', ')}`);
  }

  const resIds = {};
  for (const resU of RES_USERS) {
    const resHash = await bcrypt.hash(process.env[resU.passwordEnv], 10);
    const resIns = await resQuery(
      'INSERT INTO users (name, email, password_hash, role, zone, phone) VALUES (?,?,?,?,?,?)',
      [resU.name, resU.email, resHash, resU.role, resU.zone, null]
    );
    resIds[resU.email] = resIns.insertId;
    if (resU.org) {
      const [resName, resType, resAddr, resCap, resStatus] = resU.org;
      await resQuery(
        'INSERT INTO organisations (user_id, org_name, org_type, zone, address, capacity, status) VALUES (?,?,?,?,?,?,?)',
        [resIns.insertId, resName, resType, resU.zone, resAddr, resCap, resStatus]
      );
    }
    if (resU.vol) {
      const [resSkills, resXp, resCoins, resBadge, resDone] = resU.vol;
      await resQuery(
        'INSERT INTO volunteers (user_id, skills, xp, coins, badge, completed_missions) VALUES (?,?,?,?,?,?)',
        [resIns.insertId, resSkills, resXp, resCoins, resBadge, resDone]
      );
    }
  }

  for (const resZone of RES_ZONES) {
    const resTypes = ['food', 'water', 'medicine', 'cots', 'vehicles'];
    for (let resI = 0; resI < resTypes.length; resI++) {
      await resQuery('INSERT INTO resources (zone, resource_type, available, unit_name) VALUES (?,?,?,?)', [
        resZone, resTypes[resI], RES_STOCK[resZone][resI], RES_UNITS[resTypes[resI]],
      ]);
    }
  }

  const resAdmin = resIds['admin@example.invalid'];
  // same cases as the original project; arrival gaps give nice numbers in the scheduling lab
  const resCases = [
    [66, { title: 'Flash flood river overflow at Sector 4', case_type: 'flood', priority: 1, zone: 'Zone A', location: 'North Riverside Crossing', food: 60, water: 80, medicine: 25, cots: 20, vehicles: 4, burst_time: 60 }],
    [52, { title: 'Commercial kitchen chemical fire', case_type: 'fire', priority: 1, zone: 'Zone B', location: 'Market Street Block 12', food: 20, water: 40, medicine: 30, vehicles: 3, burst_time: 45 }],
    [35, { title: 'Apartment building tremor damage', case_type: 'earthquake', priority: 2, zone: 'Zone C', location: 'Highland Ridge Complex', food: 50, water: 60, medicine: 20, cots: 30, vehicles: 2, burst_time: 50 }],
    [15, { title: 'Mass heatstroke at Central Relief Center', case_type: 'medical', priority: 1, zone: 'Zone A', location: 'Central Plaza Shelter', food: 30, water: 70, medicine: 40, cots: 10, vehicles: 2, burst_time: 35 }],
    [0, { title: 'Supply shortage at East Camp', case_type: 'other', priority: 3, zone: 'Zone D', location: 'East District High School', food: 120, water: 150, medicine: 25, cots: 40, vehicles: 1, burst_time: 25 }],
  ];
  for (const [resAgo, resCase] of resCases) {
    await resCreateCase({ ...resCase, reported_by: resAdmin }, resMinutesAgo(resAgo));
  }

  await resCreateRequest({ ngo_id: resIds['ngo1@example.invalid'], title: 'Night shelter for displaced families', zone: 'Zone B', priority: 2, food: 60, water: 50, medicine: 10, cots: 45 }, resMinutesAgo(40));
  await resCreateRequest({ ngo_id: resIds['ngo2@example.invalid'], title: 'Medicines for Riverside camp', zone: 'Zone A', priority: 2, water: 40, medicine: 30 }, resMinutesAgo(20));

  const resRest = resIds['restaurant1@example.invalid'];
  await resQuery(
    'INSERT INTO surplus_food (restaurant_id, title, food_type, servings, zone, expiry_time) VALUES (?,?,?,?,?,?)',
    [resRest, 'Steamed rice and dal', 'Cooked meals', 75, 'Zone A', resHoursLater(4)]
  );
  // 110 servings -> trigger trg_surplus_food_alert notifies every NGO
  await resQuery(
    'INSERT INTO surplus_food (restaurant_id, title, food_type, servings, zone, expiry_time) VALUES (?,?,?,?,?,?)',
    [resRest, 'Bread rolls and vegetable curry', 'Baked and cooked', 110, 'Zone A', resHoursLater(5)]
  );

  await resNotify('all', null, 'info', 'Welcome to ResQSync', 'Demo data is loaded. The city controller can run the allocation from the Emergency queue.');
  await resNotify('admin', null, 'alert', 'Organisations waiting', '2 organisations are waiting for verification.');
}

