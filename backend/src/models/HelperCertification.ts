import mongoose, { Schema, Document } from 'mongoose';

export interface IHelperCertification extends Document {
    helperId: mongoose.Types.ObjectId;

    currentTier: 'NONE' | 'VERIFIED' | 'PREMIUM' | 'ELITE';

    verified: {
        achievedAt?: Date;
        requirements: {
            idVerified: boolean;
            backgroundCheckPassed: boolean;
            tasksCompleted: number;
            ratingMet: boolean;
        };
    };

    premium: {
        achievedAt?: Date;
        subscriptionActive: boolean;
        subscriptionPlan?: 'MONTHLY' | 'YEARLY';
        subscriptionAmount?: number;
        subscriptionExpiry?: Date;
        requirements: {
            tasksCompleted: number;
            ratingMet: boolean;
            completionRate: number;
            trainingCompleted: boolean;
            noComplaints90Days: boolean;
        };
        trainingProgress: {
            module1_gps: { completed: boolean; score: number };
            module2_photos: { completed: boolean; score: number };
            module3_communication: { completed: boolean; score: number };
            module4_verification: { completed: boolean; score: number };
            module5_exam: { completed: boolean; score: number };
            overallProgress: number;
        };
    };

    elite: {
        achievedAt?: Date;
        invitationSent: boolean;
        invitationAccepted: boolean;
        subscriptionActive: boolean;
        requirements: {
            premiumMonths: number;
            tasksCompleted: number;
            ratingMet: boolean;
            completionRate: number;
            donorRecommendations: number;
            noComplaints180Days: boolean;
        };
    };

    createdAt: Date;
    updatedAt: Date;
}

const HelperCertificationSchema: Schema = new Schema(
    {
        helperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

        currentTier: {
            type: String,
            enum: ['NONE', 'VERIFIED', 'PREMIUM', 'ELITE'],
            default: 'NONE',
            index: true,
        },

        verified: {
            achievedAt: { type: Date },
            requirements: {
                idVerified: { type: Boolean, default: false },
                backgroundCheckPassed: { type: Boolean, default: false },
                tasksCompleted: { type: Number, default: 0 },
                ratingMet: { type: Boolean, default: false },
            },
        },

        premium: {
            achievedAt: { type: Date },
            subscriptionActive: { type: Boolean, default: false },
            subscriptionPlan: { type: String, enum: ['MONTHLY', 'YEARLY'] },
            subscriptionAmount: { type: Number },
            subscriptionExpiry: { type: Date },
            requirements: {
                tasksCompleted: { type: Number, default: 0 },
                ratingMet: { type: Boolean, default: false },
                completionRate: { type: Number, default: 0 },
                trainingCompleted: { type: Boolean, default: false },
                noComplaints90Days: { type: Boolean, default: true },
            },
            trainingProgress: {
                module1_gps: { completed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
                module2_photos: { completed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
                module3_communication: { completed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
                module4_verification: { completed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
                module5_exam: { completed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
                overallProgress: { type: Number, default: 0 },
            },
        },

        elite: {
            achievedAt: { type: Date },
            invitationSent: { type: Boolean, default: false },
            invitationAccepted: { type: Boolean, default: false },
            subscriptionActive: { type: Boolean, default: false },
            requirements: {
                premiumMonths: { type: Number, default: 0 },
                tasksCompleted: { type: Number, default: 0 },
                ratingMet: { type: Boolean, default: false },
                completionRate: { type: Number, default: 0 },
                donorRecommendations: { type: Number, default: 0 },
                noComplaints180Days: { type: Boolean, default: true },
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IHelperCertification>('HelperCertification', HelperCertificationSchema);
