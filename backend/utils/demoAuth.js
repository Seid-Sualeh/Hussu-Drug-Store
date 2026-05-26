const isProduction = process.env.NODE_ENV === 'production';

export const DEMO_USERS = isProduction
  ? {}
  : {
      admin: {
        id: 1,
        username: 'admin',
        passwordHash: '$2a$10$UA65q58gZXFG2vxO5DNZ0.Em6voS35JmMidxhlY2mrkNEgolCq5ka',
        name: 'Aman Singh',
        role: 'admin',
        avatar_initials: 'AS',
        email: 'admin@medicare.com',
      },
      guest: {
        id: 2,
        username: 'guest',
        passwordHash: '$2a$10$Bs1LHfB2ElrA2OO8keoYMOAmnSWxrDRsBrSqmJAQMuQBmWzB6FCNu',
        name: 'Guest User',
        role: 'guest',
        avatar_initials: 'GU',
        email: 'guest@medicare.com',
      },
    };

export function isDemoLoginAllowed() {
  return !isProduction;
}
