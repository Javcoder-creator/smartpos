import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  sequelize,
  Business,
  SubscriptionPlan,
  Subscription,
  Role,
  User,
  Branch,
  Warehouse,
  AuditLog,
} from '../../database/models';
import { AppError } from '../../utils/AppError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
} from '../../utils/jwt';

export class AuthService {
  static async register(data: {
    businessName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Ushbu email bilan ro‘yxatdan o‘tilgan', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Generate unique slug
      let baseSlug = data.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = 'business';
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // 2. Create Business
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const business = await Business.create(
        {
          id: uuidv4(),
          name: data.businessName,
          slug,
          email: data.email,
          phone: data.phone,
          timezone: 'Asia/Tashkent',
          currency: 'UZS',
          defaultLanguage: 'uz',
          isActive: true,
          trialEndsAt: trialEndDate,
        },
        { transaction }
      );

      // 3. Find START plan & create 14-day trial subscription
      const plan = await SubscriptionPlan.findOne({ where: { slug: 'start' } });
      if (plan) {
        await Subscription.create(
          {
            id: uuidv4(),
            businessId: business.id,
            planId: plan.id,
            status: 'trial',
            startDate: new Date(),
            endDate: trialEndDate,
            trialEndDate,
            amount: 0,
            billingCycle: 'monthly',
            autoRenew: true,
          },
          { transaction }
        );
      }

      // 4. Create default Main Branch
      const branch = await Branch.create(
        {
          id: uuidv4(),
          businessId: business.id,
          name: 'Asosiy filial',
          isMain: true,
          isActive: true,
        },
        { transaction }
      );

      // 5. Create default Main Warehouse
      await Warehouse.create(
        {
          id: uuidv4(),
          businessId: business.id,
          branchId: branch.id,
          name: 'Asosiy ombor',
          isDefault: true,
          isActive: true,
        },
        { transaction }
      );

      // 6. Find business_owner role
      const ownerRole = await Role.findOne({ where: { slug: 'business_owner' } });
      if (!ownerRole) {
        throw new AppError('Tizim roli topilmadi', 500);
      }

      // 7. Hash password & create User
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await User.create(
        {
          id: uuidv4(),
          businessId: business.id,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: ownerRole.id,
          branchId: branch.id,
          isActive: true,
          language: 'uz',
        },
        { transaction }
      );

      await transaction.commit();

      // 8. Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        businessId: business.id,
        role: 'business_owner',
        email: user.email,
      });

      const refreshToken = generateRefreshToken({ id: user.id });
      await user.update({ refreshToken, lastLoginAt: new Date() });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: 'business_owner',
          businessId: business.id,
        },
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          currency: business.currency,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async login(data: { email: string; password: string }) {
    const user = await User.findOne({
      where: { email: data.email },
      include: [
        { model: Role, as: 'role' },
        { model: Business, as: 'business' },
        { model: Branch, as: 'branch' },
      ],
    });

    if (!user) {
      throw new AppError('Email yoki parol noto‘g‘ri', 401);
    }

    if (!user.isActive) {
      throw new AppError('Hisobingiz faol emas. Administratorga murojaat qiling', 403);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Email yoki parol noto‘g‘ri', 401);
    }

    const userRole = (user as any).role?.slug || 'cashier';
    const userBusiness = (user as any).business;

    if (user.businessId && userBusiness && !userBusiness.isActive) {
      throw new AppError('Kompaniya hisobi to‘xtatilgan', 403);
    }

    const accessToken = generateAccessToken({
      id: user.id,
      businessId: user.businessId,
      role: userRole,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    await user.update({
      refreshToken,
      lastLoginAt: new Date(),
    });

    // Record audit log
    try {
      await AuditLog.create({
        id: uuidv4(),
        businessId: user.businessId,
        userId: user.id,
        action: 'auth.login',
        entity: 'User',
        entityId: user.id,
      });
    } catch {
      // audit log shouldn't block login
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: userRole,
        businessId: user.businessId,
        branchId: user.branchId,
        language: user.language,
        avatarUrl: user.avatarUrl,
      },
      business: userBusiness
        ? {
            id: userBusiness.id,
            name: userBusiness.name,
            slug: userBusiness.slug,
            currency: userBusiness.currency,
            timezone: userBusiness.timezone,
            logoUrl: userBusiness.logoUrl,
          }
        : null,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  static async refreshToken(token: string) {
    if (!token) {
      throw new AppError('Refresh token talab qilinadi', 401);
    }

    let decoded: { id: string };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AppError('Yaroqsiz yoki muddati o‘tgan refresh token', 401);
    }

    const user = await User.findOne({
      where: { id: decoded.id },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || user.refreshToken !== token) {
      throw new AppError('Refresh token mos kelmadi', 401);
    }

    const userRole = (user as any).role?.slug || 'cashier';

    const newAccessToken = generateAccessToken({
      id: user.id,
      businessId: user.businessId,
      role: userRole,
      email: user.email,
    });

    const newRefreshToken = generateRefreshToken({ id: user.id });
    await user.update({ refreshToken: newRefreshToken });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(userId: string) {
    await User.update({ refreshToken: undefined }, { where: { id: userId } });
    return { success: true };
  }

  static async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role' },
        { model: Business, as: 'business', include: [{ model: Subscription, as: 'subscription', include: [{ model: SubscriptionPlan, as: 'plan' }] }] },
        { model: Branch, as: 'branch' },
      ],
    });

    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    return user;
  }

  static async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string; language?: string; avatarUrl?: string }
  ) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    await user.update(data);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      language: user.language,
      avatarUrl: user.avatarUrl,
    };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Joriy parol noto‘g‘ri', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, refreshToken: undefined });

    return { success: true, message: 'Parol muvaffaqiyatli yangilandi' };
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success for security to not leak registered emails
      return { message: 'Agar ushbu email ro‘yxatdan o‘tgan bo‘lsa, tiklash havolasi yuborildi' };
    }

    const token = generateResetToken({ id: user.id, email: user.email });
    return {
      message: 'Parolni tiklash havolasi tayyorlandi',
      resetToken: token, // Returned for dev/testing environment
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    let decoded: { id: string; email: string };
    try {
      decoded = verifyResetToken(token);
    } catch {
      throw new AppError('Yaroqsiz yoki muddati o‘tgan tiklash tokeni', 400);
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword, refreshToken: undefined });

    return { success: true, message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
