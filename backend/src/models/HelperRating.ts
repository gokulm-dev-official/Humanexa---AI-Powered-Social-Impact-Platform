import mongoose, { Schema, Document } from 'mongoose';

export interface IHelperRating extends Document {
    helperId: mongoose.Types.ObjectId;
    ratedBy: mongoose.Types.ObjectId;
    raterRole: 'donor' | 'institution' | 'admin';

    requestId?: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;

    scores: {
        overall: number;
        punctuality: number;
        photoQuality: number;
        professionalism: number;
        accuracy: number;
    };

    weightedScore: number;

    comment?: string;
    isPublic: boolean;

    taskCompletionTime?: number;
    photoCount?: number;
    wasOnTime: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const HelperRatingSchema: Schema = new Schema(
    {
        helperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        ratedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        raterRole: { type: String, enum: ['donor', 'institution', 'admin'], required: true },

        requestId: { type: Schema.Types.ObjectId, ref: 'HelpRequest' },
        taskId: { type: Schema.Types.ObjectId, ref: 'VerificationTask' },

        scores: {
            overall: { type: Number, required: true, min: 1, max: 5 },
            punctuality: { type: Number, required: true, min: 1, max: 5 },
            photoQuality: { type: Number, required: true, min: 1, max: 5 },
            professionalism: { type: Number, required: true, min: 1, max: 5 },
            accuracy: { type: Number, required: true, min: 1, max: 5 },
        },

        weightedScore: { type: Number, required: true },

        comment: { type: String, maxlength: 500 },
        isPublic: { type: Boolean, default: false },

        taskCompletionTime: { type: Number },
        photoCount: { type: Number },
        wasOnTime: { type: Boolean, default: true },
    },
    { timestamps: true }
);

HelperRatingSchema.index({ helperId: 1, createdAt: -1 });
HelperRatingSchema.index({ ratedBy: 1, helperId: 1 });

export default mongoose.model<IHelperRating>('HelperRating', HelperRatingSchema);
