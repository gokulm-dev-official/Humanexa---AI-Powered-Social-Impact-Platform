const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/social_kind';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String,
            phoneNumber: { type: String, unique: true },
            profile: { fullName: String, avatar: String },
            creditScore: { rank: String, totalPoints: Number },
            statistics: { totalHelps: Number, livesTouched: Number }
        }));

        const HelpRequest = mongoose.model('HelpRequest', new mongoose.Schema({
            donorId: mongoose.Schema.Types.ObjectId,
            helperId: mongoose.Schema.Types.ObjectId,
            title: String,
            description: String,
            status: String,
            requestType: String,
            amount: { value: Number },
            amountRaised: { type: Number, default: 0 },
            location: { 
                address: String, 
                coordinates: { 
                    type: { type: String, default: 'Point' }, 
                    coordinates: [Number] 
                } 
            },
            views: { type: Number, default:0 },
            shares: { type: Number, default: 0 },
            timeline: { createdAt: { type: Date, default: Date.now } }
        }));

        const ImpactChat = mongoose.model('ImpactChat', new mongoose.Schema({
            donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            helperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: String,
            amount: Number,
            messages: [{ text: String, sender: mongoose.Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } }],
            updatedAt: { type: Date, default: Date.now }
        }, { timestamps: true }));

        // Find or create an institution
        let institution = await User.findOne({ role: 'institution' });
        if (!institution) {
            console.log('No institution found, creating a test one...');
            institution = await User.create({
                email: 'ashram@example.com',
                role: 'institution',
                phoneNumber: '9876543210',
                profile: { fullName: 'Ananda Ashramam Trust' },
                creditScore: { rank: 'Platinum', totalPoints: 2500 }
            });
        }

        // Create some donors (helpers)
        const donorsData = [
            { email: 'rahul@example.com', name: 'Rahul Sharma', rank: 'Gold', phone: '9999999991' },
            { email: 'priya@example.com', name: 'Priya Patel', rank: 'Platinum', phone: '9999999992' },
            { email: 'anita@example.com', name: 'Anita Desai', rank: 'Silver', phone: '9999999993' }
        ];

        const donors = [];
        for (const data of donorsData) {
            let user = await User.findOne({ email: data.email });
            if (!user) {
                user = await User.create({
                    email: data.email,
                    role: 'individual',
                    phoneNumber: data.phone,
                    profile: { fullName: data.name },
                    creditScore: { rank: data.rank, totalPoints: 1500 }
                });
            }
            donors.push(user);
        }

        // Create some requests for this institution
        const requestsData = [
            { title: 'Emergency Oxygen Support', type: 'medicine', status: 'funding', goal: 50000, raised: 32000, views: 1250, shares: 85 },
            { title: 'Community Kitchen Supplies', type: 'food', status: 'funded', goal: 15000, raised: 15000, views: 840, shares: 42 },
            { title: 'Rural Clinic Medicine', type: 'medicine', status: 'urgent', goal: 25000, raised: 12000, views: 2100, shares: 156 }
        ];

        for (const data of requestsData) {
            await HelpRequest.create({
                donorId: institution._id,
                title: data.title,
                description: 'Essential support needed for the community.',
                requestType: data.type,
                status: data.status,
                amount: { value: data.goal },
                amountRaised: data.raised,
                views: data.views,
                shares: data.shares,
                location: { 
                    address: 'Mumbai, Maharashtra', 
                    coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] } 
                }
            });
        }

        // Create some realistic chats
        const chatsData = [
            { helper: donors[0], text: 'Namaste, I would like to help with the Oxygen support. How soon is it needed?', amount: 5000 },
            { helper: donors[1], text: 'I am a doctor nearby, can I volunteer for the rural clinic?', amount: 0 },
            { helper: donors[2], text: 'Sent 2000 for the kitchen. Thank you for your service!', amount: 2000 }
        ];

        for (const data of chatsData) {
            await ImpactChat.create({
                donorId: institution._id,
                helperId: data.helper._id,
                status: 'active',
                amount: data.amount,
                messages: [{ text: data.text, sender: data.helper._id }],
                updatedAt: new Date()
            });
        }

        console.log('Seed completed successfully for institution:', institution.profile.fullName);
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
};

seedData();
