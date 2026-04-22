import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    phoneNumber: string;
    password?: string;
    role: 'donor' | 'helper' | 'institution' | 'admin' | 'super_admin';
    profile: {
        fullName: string;
        avatar?: string;
        dateOfBirth?: Date;
        gender?: 'male' | 'female' | 'other';
        bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
        bio?: string;
    };
    address: {
        formattedAddress?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        coordinates?: {
            type: 'Point';
            coordinates: [number, number]; // [lng, lat]
        };
    };
    governmentId: {
        idType?: 'aadhaar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
        numberEncrypted?: string;
        documentUrl?: string;
        verified: boolean;
        verifiedAt?: Date;
        verifiedBy?: mongoose.Types.ObjectId;
    };
    creditScore: {
        totalPoints: number;
        yearlyPoints: number;
        rank: string;
        level: number;
        streak: {
            current: number;
            longest: number;
            lastActivityAt?: Date;
        };
        badges: Array<{
            name: string;
            icon: string;
            unlockedAt: Date;
        }>;
        certificates: Array<{
            id: string;
            name: string; // e.g., "Silver Streak", "Daily High Donor"
            type: 'streak' | 'daily_award';
            tier?: 'silver' | 'gold' | 'elite' | 'diamond' | 'legend';
            issuedAt: Date;
            description: string;
        }>;
    };
    wallet: {
        balance: number;
        totalDonated: number;
        totalEarned: number;
        pendingAmount: number;
    };
    accountStatus: {
        active: boolean;
        suspended: boolean;
        suspensionReason?: string;
        suspendedAt?: Date;
        warnings: Array<{
            type: string;
            reason: string;
            issuedAt: Date;
        }>;
    };
    verificationStatus: {
        emailVerified: boolean;
        phoneVerified: boolean;
        idVerified: boolean;
        backgroundCheckPassed: boolean;
    };
    statistics: {
        totalDonations: number;
        totalHelps: number;
        successRate: number;
    };
    preferences: {
        notifications: boolean;
        language: string;
        currency: string;
    };
    lastLoginAt?: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        phoneNumber: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ['donor', 'helper', 'institution', 'admin', 'super_admin'], default: 'donor' },
        profile: {
            fullName: { type: String, required: true },
            avatar: String,
            dateOfBirth: Date,
            gender: { type: String, enum: ['male', 'female', 'other'] },
            bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            bio: String,
        },
        address: {
            formattedAddress: String,
            street: String,
            city: String,
            state: String,
            country: String,
            pincode: String,
            coordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] },
            },
        },
        governmentId: {
            idType: { type: String, enum: ['aadhaar', 'pan', 'voter_id', 'passport', 'driving_license'] },
            numberEncrypted: String,
            documentUrl: String,
            verified: { type: Boolean, default: false },
            verifiedAt: Date,
            verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        creditScore: {
            totalPoints: { type: Number, default: 0 },
            yearlyPoints: { type: Number, default: 0 },
            rank: { type: String, default: 'Bronze' },
            level: { type: Number, default: 1 },
            streak: {
                current: { type: Number, default: 0 },
                longest: { type: Number, default: 0 },
                lastActivityAt: Date,
            },
            badges: [
                {
                    name: String,
                    icon: String,
                    unlockedAt: { type: Date, default: Date.now },
                },
            ],
            certificates: [
                {
                    id: String,
                    name: String,
                    type: { type: String, enum: ['streak', 'daily_award'] },
                    tier: { type: String, enum: ['silver', 'gold', 'elite', 'diamond', 'legend'] },
                    issuedAt: { type: Date, default: Date.now },
                    description: String,
                }
            ],
        },
        wallet: {
            balance: { type: Number, default: 0 },
            totalDonated: { type: Number, default: 0 },
            totalEarned: { type: Number, default: 0 },
            pendingAmount: { type: Number, default: 0 },
        },
        accountStatus: {
            active: { type: Boolean, default: true },
            suspended: { type: Boolean, default: false },
            suspensionReason: String,
            suspendedAt: Date,
            warnings: [
                {
                    type: { type: String },
                    reason: String,
                    issuedAt: { type: Date, default: Date.now },
                },
            ],
        },
        verificationStatus: {
            emailVerified: { type: Boolean, default: false },
            phoneVerified: { type: Boolean, default: false },
            idVerified: { type: Boolean, default: false },
            backgroundCheckPassed: { type: Boolean, default: false },
        },
        statistics: {
            totalDonations: { type: Number, default: 0 },
            totalHelps: { type: Number, default: 0 },
            successRate: { type: Number, default: 0 },
        },
        preferences: {
            notifications: { type: Boolean, default: true },
            language: { type: String, default: 'en' },
            currency: { type: String, default: 'INR' },
        },
        lastLoginAt: Date,
        // Feature 6 & 7: Helper profile for ratings and certification
        helperProfile: {
            ratings: {
                overall: { type: Number, default: 0 },
                punctuality: { type: Number, default: 0 },
                photoQuality: { type: Number, default: 0 },
                professionalism: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 },
                count: { type: Number, default: 0 },
            },
            tier: { type: String, enum: ['NONE', 'VERIFIED', 'PREMIUM', 'ELITE'], default: 'NONE' },
            tierSince: { type: Date },
            successRate: { type: Number, default: 0 },
            totalVerifications: { type: Number, default: 0 },
            averageCompletionTime: { type: Number, default: 0 },
            badges: [String],
            achievements: [
                {
                    name: String,
                    icon: String,
                    earnedAt: { type: Date, default: Date.now },
                },
            ],
        },
        // Institution member management
        institutionMembers: [
            {
                name: { type: String, required: true },
                age: { type: Number },
                photo: { type: String },
                addedAt: { type: Date, default: Date.now },
            }
        ],
    },
    { timestamps: true }
);

// Indexes
UserSchema.index({ 'address.coordinates': '2dsphere' });

// Password hashing
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password!, salt);
        next();
    } catch (err: any) {
        next(err);
    }
});

// Compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password!);
};

export default mongoose.model<IUser>('User', UserSchema);
