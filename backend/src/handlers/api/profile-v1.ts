import { jwtService } from '../factories/auth.js';
import { currencyService, profileService } from '../factories/profile.js';
import { makeProfileHandler } from './profile-routes.js';

export const handler = makeProfileHandler(profileService, currencyService, jwtService);
