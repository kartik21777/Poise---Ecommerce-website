import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Address } from '../models/Address.js';
import { toAddressDto } from '../dtos/addressDto.js';
import { AppError } from '../utils/AppError.js';

export const getAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  res.json(addresses.map(toAddressDto));
});

export const createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  const addressCount = await Address.countDocuments({ user: userId });
  // If first address, force it to be default
  const shouldBeDefault = addressCount === 0 ? true : !!isDefault;

  if (shouldBeDefault) {
    // Unset other defaults for this user
    await Address.updateMany({ user: userId }, { isDefault: false });
  }

  const address = new Address({
    user: userId,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault: shouldBeDefault,
  });

  await address.save();
  res.status(201).json(toAddressDto(address));
});

export const updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) {
    throw new AppError(404, 'Address not found or unauthorized');
  }

  const shouldBeDefault = !!isDefault;
  if (shouldBeDefault && !address.isDefault) {
    // Unset other defaults
    await Address.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
  }

  address.fullName = fullName !== undefined ? fullName : address.fullName;
  address.phone = phone !== undefined ? phone : address.phone;
  address.addressLine1 = addressLine1 !== undefined ? addressLine1 : address.addressLine1;
  address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
  address.city = city !== undefined ? city : address.city;
  address.state = state !== undefined ? state : address.state;
  address.postalCode = postalCode !== undefined ? postalCode : address.postalCode;
  address.country = country !== undefined ? country : address.country;
  address.isDefault = shouldBeDefault;

  await address.save();

  // If we just set our only address or a default address to non-default, verify if a default is remaining
  if (!shouldBeDefault) {
    const hasDefault = await Address.findOne({ user: userId, isDefault: true });
    if (!hasDefault) {
      const anyOther = await Address.findOne({ user: userId, _id: { $ne: id } });
      if (anyOther) {
        anyOther.isDefault = true;
        await anyOther.save();
      } else {
        // Only one address left, keep it default
        address.isDefault = true;
        await address.save();
      }
    }
  }

  res.json(toAddressDto(address));
});

export const deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) {
    throw new AppError(404, 'Address not found or unauthorized');
  }

  const wasDefault = address.isDefault;
  await Address.deleteOne({ _id: id });

  // If we deleted the default address, make an alternative address default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: userId });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json({ success: true, message: 'Address deleted successfully' });
});
