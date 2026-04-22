import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationTask extends Document {
    taskId: string;
    helperId: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;

    status: 'ASSIGNED' | 'ARRIVAL_CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED_ON_TIME' | 'EXPIRED' | 'CANCELLED';

    // Countdown tracking
    countdownStartedAt?: Date;
    countdownDeadline?: Date;
    completedAt?: Date;

    // Payment
    paymentAmount: number;
    paymentStatus: 'PENDING' | 'RELEASED' | 'CANCELLED';

    // Arrival photo
    arrivalPhoto?: {
        url: string;
        gpsLat: number;
        gpsLng: number;
        timestamp: Date;
        validated: boolean;
    };

    // Proof photos (min 5)
    proofPhotos: Array<{
        url: string;
        gpsLat: number;
        gpsLng: number;
        timestamp: Date;
        validated: boolean;
        photoType: string;
    }>;

    // Checklist
    checklist: {
        itemsVerified: boolean;
        quantitiesChecked: boolean;
        expiryDatesChecked: boolean;
        matchedWithBills: boolean;
        staffConfirmed: boolean;
    };

    verificationNotes?: string;

    // Countdown warnings sent
    countdownWarnings: {
        at20min: boolean;
        at10min: boolean;
        at5min: boolean;
    };

    // Rating impact
    ratingImpact?: number;

    // Facility location (for GPS validation)
    facilityLocation: {
        latitude: number;
        longitude: number;
        address: string;
        allowedRadius: number; // meters
    };

    createdAt: Date;
    updatedAt: Date;
}

const VerificationTaskSchema: Schema = new Schema(
    {
        taskId: { type: String, required: true, unique: true, index: true },
        helperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        requestId: { type: Schema.Types.ObjectId, ref: 'HelpRequest', required: true, index: true },

        status: {
            type: String,
            enum: ['ASSIGNED', 'ARRIVAL_CONFIRMED', 'IN_PROGRESS', 'COMPLETED_ON_TIME', 'EXPIRED', 'CANCELLED'],
            default: 'ASSIGNED',
            index: true,
        },

        countdownStartedAt: { type: Date },
        countdownDeadline: { type: Date },
        completedAt: { type: Date },

        paymentAmount: { type: Number, required: true, default: 1500 },
        paymentStatus: { type: String, enum: ['PENDING', 'RELEASED', 'CANCELLED'], default: 'PENDING' },

        arrivalPhoto: {
            url: { type: String },
            gpsLat: { type: Number },
            gpsLng: { type: Number },
            timestamp: { type: Date },
            validated: { type: Boolean, default: false },
        },

        proofPhotos: [
            {
                url: { type: String, required: true },
                gpsLat: { type: Number },
                gpsLng: { type: Number },
                timestamp: { type: Date },
                validated: { type: Boolean, default: false },
                photoType: { type: String, default: 'general' },
            },
        ],

        checklist: {
            itemsVerified: { type: Boolean, default: false },
            quantitiesChecked: { type: Boolean, default: false },
            expiryDatesChecked: { type: Boolean, default: false },
            matchedWithBills: { type: Boolean, default: false },
            staffConfirmed: { type: Boolean, default: false },
        },

        verificationNotes: { type: String, maxlength: 500 },

        countdownWarnings: {
            at20min: { type: Boolean, default: false },
            at10min: { type: Boolean, default: false },
            at5min: { type: Boolean, default: false },
        },

        ratingImpact: { type: Number, default: 0 },

        facilityLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String, default: '' },
            allowedRadius: { type: Number, default: 50 },
        },
    },
    { timestamps: true }
);

VerificationTaskSchema.index({ status: 1, countdownDeadline: 1 });
VerificationTaskSchema.index({ helperId: 1, status: 1 });

export default mongoose.model<IVerificationTask>('VerificationTask', VerificationTaskSchema);
