// This file is maintained for backward compatibility.
// The core pricing logic has been moved to the domain layer (DDD).
export {
    calculateBookingStoragePrice as calculateStoragePrice,
    STORAGE_RATES,
    type StorageRate,
    type PriceResult
} from '../src/domains/booking/bookingService';
